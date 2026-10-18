"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ageFromDob } from "@/lib/format";
import { RATE_LIMITS, rateLimit } from "@/lib/rateLimit";
import { validateIndianPhone } from "@/lib/phone";
import { processImage, validateImageFile } from "@/lib/media";
import {
  deleteR2Object,
  putR2Object,
  r2Configured,
  r2KeyFromUrl,
  r2NotConfiguredError,
  r2PublicUrl,
} from "@/lib/r2";

export type ProfileFormState = { error?: string; ok?: boolean; next?: string };

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const EXPERIENCE_LEVELS = ["beginner", "intermediate", "experienced"];
const GEAR_LEVELS = ["helmet_only", "basic", "full_armored"];
const INSURANCE_STATUSES = ["valid_insured", "expired", "none"];

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/setup");
  return { supabase, user };
}

// Basic info: display_name + city on profiles; age, dob, gender, phone, whatsapp_number, occupation on rider_details.
export async function saveBasicProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { supabase, user } = await requireUser();
  if (!rateLimit("profile", user.id, RATE_LIMITS.profile)) {
    return { error: "Too many attempts — try again later." };
  }

  const displayNameInput = String(formData.get("display_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const dobRawInput = String(formData.get("dob") ?? "").trim();
  const genderInput = String(formData.get("gender") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const whatsappNumberRaw = String(formData.get("whatsapp_number") ?? "").trim();
  const occupation = String(formData.get("occupation") ?? "").trim() || null;
  const isEdit = String(formData.get("edit") ?? "") === "true";

  // Locked identity: approved riders can't change age/dob/gender here (or via
  // raw API) — submitted values are ignored while a stored value exists.
  // Display name is a public profile label, not identity — always editable.
  const { data: storedDetails } = await supabase
    .from("rider_details")
    .select("registered, age, dob, gender, kyc_submitted_at, kyc_rejected")
    .eq("user_id", user.id)
    .maybeSingle();
  const locked = Boolean(storedDetails?.registered);

  // Filed applications are read-only until the admin verdict (raw-API bypass
  // around the frozen UI is rejected here, not just hidden there).
  if (storedDetails && !storedDetails.registered && !storedDetails.kyc_rejected && storedDetails.kyc_submitted_at) {
    return { error: "Application under review — wait for the admin verdict." };
  }

  const displayName = displayNameInput;
  // Age is derived from the date of birth, never typed: locked rows reuse the
  // stored age, everyone else must supply a DOB.
  const dobRaw = locked ? (storedDetails?.dob ?? "") : dobRawInput;
  const age = locked && storedDetails?.age != null ? storedDetails.age : ageFromDob(dobRaw);
  const gender = locked && storedDetails?.gender ? storedDetails.gender : genderInput;

  if (!displayName) return { error: "Name is required." };
  if (displayName.length > 50) return { error: "Name must be 50 characters or fewer." };
  if (!city) return { error: "City / Location is required." };
  if (city.length > 100) return { error: "City must be 100 characters or fewer." };

  if (age == null || !Number.isInteger(age) || age < 18 || age > 90) {
    return { error: "Enter your date of birth — you must be 18 or older to join MotoBharat (18–90 years)." };
  }
  if (!GENDERS.includes(gender)) return { error: "Pick a valid gender option." };

  const phoneValidation = validateIndianPhone(phone);
  if (!phoneValidation.valid) {
    return { error: phoneValidation.error ?? "Enter a valid Indian mobile number." };
  }

  if (!whatsappNumberRaw) {
    return { error: "WhatsApp number is required." };
  }
  const waValidation = validateIndianPhone(whatsappNumberRaw);
  if (!waValidation.valid) {
    return { error: `WhatsApp number: ${waValidation.error ?? "Enter a valid Indian mobile number."}` };
  }
  const formattedWhatsapp = waValidation.formatted;

  const { error: pErr } = await supabase
    .from("profiles")
    .update({ display_name: displayName, city: city || null })
    .eq("id", user.id);
  if (pErr) return { error: pErr.message };

  const { error: rErr } = await supabase
    .from("rider_details")
    .upsert(
      {
        user_id: user.id,
        age,
        dob: dobRaw || null,
        gender,
        phone: phoneValidation.formatted,
        whatsapp_number: formattedWhatsapp,
        occupation,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (rErr) return { error: rErr.message };

  revalidatePath("/profile", "layout");
  // Success is reported (not redirected) so the client can clear its draft
  // and navigate: drafts die exactly on submit, never before.
  // Editing basic details returns to the profile; first-time setup continues to KYC.
  return { ok: true, next: isEdit ? "/profile" : "/profile/kyc" };
}

// KYC: rider safety, bike, licensing, emergency & declaration fields; flips registered to true.
export async function saveRiderDetails(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  console.log("[saveRiderDetails] Invoked. Starting KYC submission...");
  const { supabase, user } = await requireUser();
  console.log("[saveRiderDetails] User resolved:", user?.id);
  if (!rateLimit("profile", user.id, RATE_LIMITS.profile)) {
    console.warn("[saveRiderDetails] Rate limit tripped for user:", user?.id);
    return { error: "Too many attempts — try again later." };
  }

  // Motorcycle & Licence
  const rawBikeModel = String(formData.get("bike_model") ?? "").trim();
  const customBikeModel = String(formData.get("custom_bike_model") ?? "").trim();
  const bikeModel = rawBikeModel === "other" ? customBikeModel : rawBikeModel;
  const bikeRegNo = String(formData.get("bike_reg_no") ?? "").trim().toUpperCase();
  let drivingLicence = String(formData.get("driving_licence") ?? "").trim().toUpperCase();
  const experienceLevel = String(formData.get("experience_level") ?? "");
  const gearLevel = String(formData.get("gear_level") ?? "");
  const vehicleInsuranceStatus = String(formData.get("vehicle_insurance_status") ?? "valid_insured");
  const hasRsa = formData.get("has_rsa") === "true" || formData.get("has_rsa") === "on";
  const ridesWithPillion = formData.get("rides_with_pillion") === "true" || formData.get("rides_with_pillion") === "on";

  // Emergency & Medical
  let bloodGroup = String(formData.get("blood_group") ?? "");
  const ecName = String(formData.get("emergency_contact_name") ?? "").trim();
  const ecPhone = String(formData.get("emergency_contact_phone") ?? "").trim();
  const ecRelation = String(formData.get("emergency_contact_relation") ?? "").trim();
  const ec2Phone = String(formData.get("emergency_contact_2_phone") ?? "").trim() || null;
  const medicalConditions = String(formData.get("medical_conditions") ?? "").trim() || null;
  const personalHealthInsurance = formData.get("personal_health_insurance") === "true" || formData.get("personal_health_insurance") === "on";

  // Community & Social
  const permanentAddress = String(formData.get("permanent_address") ?? "").trim() || null;
  const instagramHandle = String(formData.get("instagram_handle") ?? "").trim().replace(/^@/, "") || null;
  const referralSource = String(formData.get("referral_source") ?? "").trim() || null;
  const suggestions = String(formData.get("suggestions") ?? "").trim() || null;

  // Declaration & Signature
  const declarationConfirmed = formData.get("declaration_confirmed") === "true" || formData.get("declaration_confirmed") === "on";
  let digitalSignature = String(formData.get("digital_signature") ?? "").trim();

  // Field validations
  if (!bikeModel) { console.log("[saveRiderDetails] Missing bikeModel"); return { error: "Motorcycle brand & model is required." }; }
  if (!bikeRegNo) { console.log("[saveRiderDetails] Missing bikeRegNo"); return { error: "Vehicle registration/plate number is required." }; }
  if (!drivingLicence) { console.log("[saveRiderDetails] Missing drivingLicence"); return { error: "Driving licence number is required." }; }
  if (!EXPERIENCE_LEVELS.includes(experienceLevel)) { console.log("[saveRiderDetails] Invalid experienceLevel:", experienceLevel); return { error: "Select your riding experience level." }; }
  if (!GEAR_LEVELS.includes(gearLevel)) { console.log("[saveRiderDetails] Invalid gearLevel:", gearLevel); return { error: "Select your overall riding gear level." }; }
  if (!INSURANCE_STATUSES.includes(vehicleInsuranceStatus)) { console.log("[saveRiderDetails] Invalid vehicleInsuranceStatus:", vehicleInsuranceStatus); return { error: "Select vehicle insurance status." }; }

  if (!BLOOD_GROUPS.includes(bloodGroup)) { console.log("[saveRiderDetails] Invalid bloodGroup:", bloodGroup); return { error: "Pick a valid blood group." }; }
  if (!ecName) { console.log("[saveRiderDetails] Missing ecName"); return { error: "Primary emergency contact name is required." }; }

  const ecValidation = validateIndianPhone(ecPhone);
  if (!ecValidation.valid) {
    console.log("[saveRiderDetails] Invalid ecPhone:", ecPhone, ecValidation.error);
    return { error: `Emergency contact: ${ecValidation.error ?? "Enter a valid Indian mobile number."}` };
  }

  let formattedEc2: string | null = null;
  if (ec2Phone) {
    const ec2Validation = validateIndianPhone(ec2Phone);
    if (!ec2Validation.valid) {
      console.log("[saveRiderDetails] Invalid ec2Phone:", ec2Phone, ec2Validation.error);
      return { error: `Secondary emergency contact: ${ec2Validation.error ?? "Enter a valid Indian mobile number."}` };
    }
    formattedEc2 = ec2Validation.formatted;
  }

  if (!ecRelation) { console.log("[saveRiderDetails] Missing ecRelation"); return { error: "Relationship with emergency contact is required." }; }

  if (!declarationConfirmed) {
    console.log("[saveRiderDetails] Missing declarationConfirmed");
    return { error: "You must accept the safety rules and risk disclaimer to complete registration." };
  }
  if (!digitalSignature) {
    console.log("[saveRiderDetails] Missing digitalSignature");
    return { error: "Type your full name as digital signature to confirm." };
  }

  // Basic info must exist before KYC (enforced by the setup flow).
  const { data: existing } = await supabase
    .from("rider_details")
    .select("registered, age, gender, phone, dob, whatsapp_number, occupation, dl_image_url, blood_group, driving_licence, digital_signature, kyc_submitted_at, kyc_rejected")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing?.age || !existing?.gender || !existing?.phone) {
    console.warn("[saveRiderDetails] Basic info missing in rider_details for user:", user.id);
    redirect("/profile/setup");
  }

  // Filed applications are read-only until the admin verdict.
  if (!existing.registered && !existing.kyc_rejected && existing.kyc_submitted_at) {
    return { error: "Application under review — wait for the admin verdict." };
  }

  // Locked identity: approved riders keep a stored blood group / DL number —
  // submitted values are ignored while one exists. A field that was never set
  // (legacy rows) still accepts its first value, so old accounts can't get
  // stuck behind a disabled input.
  const locked = existing.registered ?? false;
  if (locked && existing.blood_group) bloodGroup = existing.blood_group;
  if (locked && existing.driving_licence) drivingLicence = existing.driving_licence;
  // Full name / signature is identity, not profile text: same lock, same
  // never-set-still-accepts rule as the other frozen fields.
  if (locked && existing.digital_signature) digitalSignature = existing.digital_signature;

  // DL photo: mandatory KYC data until approval, purged at approval. Locked
  // rows ignore uploads entirely (approved accounts hold no photo); everyone
  // else must have a stored photo or attach one now.
  const dlFile = formData.get("dl_document") as File | null;
  const picked = dlFile && dlFile.size > 0 ? dlFile : null;
  const dlUpload = locked ? null : picked;
  if (!locked && !existing.dl_image_url && !dlUpload) {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Licence photo can't be saved — photo storage isn't connected") };
    }
    return { error: "Driving licence photo is required — upload a clear JPEG or WebP (max 10 MB)." };
  }

  let nextDlUrl: string | null = existing.dl_image_url ?? null;
  let newDlKey: string | null = null;
  const oldDlKey = nextDlUrl ? r2KeyFromUrl(nextDlUrl) : null;

  if (dlUpload) {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Licence photo can't be saved — photo storage isn't connected") };
    }
    const invalid = await validateImageFile(dlUpload);
    if (invalid) return { error: `Licence photo: ${invalid}` };
    const image = await processImage(dlUpload, 1600, 80);
    const key = `rider-docs/${user.id}/dl_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);
    newDlKey = key;
    nextDlUrl = r2PublicUrl(key);
  }

  console.log("[saveRiderDetails] Performing upsert on rider_details for user:", user.id);
  const { error } = await supabase
    .from("rider_details")
    .upsert(
      {
        user_id: user.id,
        age: existing.age,
        gender: existing.gender,
        phone: existing.phone,
        dob: existing.dob,
        whatsapp_number: existing.whatsapp_number,
        occupation: existing.occupation,
        blood_group: bloodGroup,
        emergency_contact_name: ecName,
        emergency_contact_phone: ecValidation.formatted,
        emergency_contact_relation: ecRelation,
        emergency_contact_2_phone: formattedEc2,
        bike_model: bikeModel,
        bike_reg_no: bikeRegNo,
        driving_licence: drivingLicence,
        experience_level: experienceLevel,
        gear_level: gearLevel,
        vehicle_insurance_status: vehicleInsuranceStatus,
        medical_conditions: medicalConditions,
        personal_health_insurance: personalHealthInsurance,
        has_rsa: hasRsa,
        rides_with_pillion: ridesWithPillion,
        permanent_address: permanentAddress,
        instagram_handle: instagramHandle,
        referral_source: referralSource,
        suggestions: suggestions,
        declaration_confirmed: true,
        digital_signature: digitalSignature,
        // Filing for review, not self-approving: registered stays false until
        // an admin approves (already-approved riders keep their status on edit).
        registered: existing.registered ?? false,
        kyc_submitted_at: new Date().toISOString(),
        kyc_rejected: false,
        rejection_reason: null,
        dl_image_url: nextDlUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) {
    console.error("[saveRiderDetails] Upsert ERROR:", error);
    if (newDlKey) {
      try {
        await deleteR2Object(newDlKey);
      } catch (e) {
        console.warn(`[saveRiderDetails] failed to clean up orphan DL ${newDlKey}:`, e);
      }
    }
    return { error: error.message };
  }
  if (newDlKey && oldDlKey) {
    try {
      await deleteR2Object(oldDlKey);
    } catch (e) {
      console.warn(`[saveRiderDetails] failed to delete old DL ${oldDlKey}:`, e);
    }
  }

  console.log("[saveRiderDetails] SUCCESS! Revalidating and reporting ok...");
  revalidatePath("/profile", "layout");
  return { ok: true };
}

export type AvatarFormState = {
  error?: string;
  ok?: boolean;
  avatar_url?: string | null;
};

export async function updateAvatar(
  _prev: AvatarFormState,
  formData: FormData,
): Promise<AvatarFormState> {
  const { supabase, user } = await requireUser();
  if (!rateLimit("profile", user.id, RATE_LIMITS.profile)) {
    return { error: "Too many attempts — try again later." };
  }

  const isRemove = formData.get("remove") === "true";
  if (isRemove) {
    const { data: current } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (error) return { error: error.message };

    const oldKey = current?.avatar_url ? r2KeyFromUrl(current.avatar_url) : null;
    if (oldKey) {
      try {
        await deleteR2Object(oldKey);
      } catch (e) {
        console.warn("[updateAvatar] failed to delete old avatar", e);
      }
    }

    revalidatePath("/profile");
    revalidatePath("/", "layout");
    return { ok: true, avatar_url: null };
  }

  const file = formData.get("avatar_file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please choose an image file to upload." };
  }

  let finalUrl: string | null = null;
  let newAvatarKey: string | null = null;

  const invalid = await validateImageFile(file);
  if (invalid) {
    return { error: invalid };
  }

  const processed = await processImage(file, 400, 80);

  if (await r2Configured()) {
    const key = `avatars/${user.id}/${crypto.randomUUID()}.${processed.format}`;
    await putR2Object(key, processed.data, processed.contentType);
    newAvatarKey = key;
    finalUrl = r2PublicUrl(key);
  } else {
    finalUrl = `data:${processed.contentType};base64,${processed.data.toString("base64")}`;
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: finalUrl })
    .eq("id", user.id);

  if (error) {
    if (newAvatarKey) {
      try {
        await deleteR2Object(newAvatarKey);
      } catch (e) {
        console.warn("[updateAvatar] failed to clean up orphan avatar", e);
      }
    }
    return { error: error.message };
  }

  const oldKey = current?.avatar_url ? r2KeyFromUrl(current.avatar_url) : null;
  if (oldKey) {
    try {
      await deleteR2Object(oldKey);
    } catch (e) {
      console.warn("[updateAvatar] failed to delete old avatar", e);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true, avatar_url: finalUrl };
}

