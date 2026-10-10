"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string };

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/setup");
  return { supabase, user };
}

function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

// Basic info: display_name + city on profiles; age + gender on rider_details (registered untouched).
export async function saveBasicProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { supabase, user } = await requireUser();

  const displayName = String(formData.get("display_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const gender = String(formData.get("gender") ?? "");

  if (!displayName) return { error: "Name is required." };
  if (displayName.length > 50) return { error: "Name must be 50 characters or fewer." };

  const age = Number(ageRaw);
  if (!ageRaw || !Number.isInteger(age) || age < 18 || age > 90) {
    return { error: "Age must be a whole number between 18 and 90." };
  }
  if (!GENDERS.includes(gender)) return { error: "Pick a gender option." };

  const { error: pErr } = await supabase
    .from("profiles")
    .update({ display_name: displayName, city: city || null })
    .eq("id", user.id);
  if (pErr) return { error: pErr.message };

  const { error: rErr } = await supabase
    .from("rider_details")
    .upsert(
      { user_id: user.id, age, gender, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (rErr) return { error: rErr.message };

  revalidatePath("/profile", "layout");
  redirect("/profile/kyc");
}

// KYC: rider safety fields; only place registered flips to true.
export async function saveRiderDetails(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { supabase, user } = await requireUser();

  const phone = String(formData.get("phone") ?? "").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "");
  const ecName = String(formData.get("emergency_contact_name") ?? "").trim();
  const ecPhone = String(formData.get("emergency_contact_phone") ?? "").trim();
  const bikeModel = String(formData.get("bike_model") ?? "").trim();

  if (!phone || !validPhone(phone)) return { error: "Enter a valid phone number (8–15 digits)." };
  if (!BLOOD_GROUPS.includes(bloodGroup)) return { error: "Pick a blood group." };
  if (!ecName) return { error: "Emergency contact name is required." };
  if (!ecPhone || !validPhone(ecPhone)) {
    return { error: "Enter a valid emergency contact phone (8–15 digits)." };
  }
  if (!bikeModel) return { error: "Bike model is required." };

  // Basic info must exist before KYC (enforced by the setup flow).
  const { data: existing } = await supabase
    .from("rider_details")
    .select("age, gender")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing?.age || !existing?.gender) redirect("/profile/setup");

  const { error } = await supabase
    .from("rider_details")
    .upsert(
      {
        user_id: user.id,
        phone,
        blood_group: bloodGroup,
        emergency_contact_name: ecName,
        emergency_contact_phone: ecPhone,
        bike_model: bikeModel,
        registered: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) return { error: error.message };

  revalidatePath("/profile", "layout");
  redirect("/profile");
}
