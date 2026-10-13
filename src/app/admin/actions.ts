"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ageFromDob, slugify } from "@/lib/format";
import { processImage, validateImageFile } from "@/lib/media";
import { validateExternalImageUrl } from "@/lib/url-image";
import { deleteR2Object, putR2Object, r2Configured, r2KeyFromUrl, r2PublicUrl } from "@/lib/r2";
import { RATE_LIMITS, rateLimit } from "@/lib/rateLimit";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");
  if (!rateLimit("admin", user.id, RATE_LIMITS.admin)) {
    return { error: "Too many admin actions — wait a minute and try again." };
  }
  console.log(`[admin] ${user.id} ${new Date().toISOString()}`);
  return { supabase, user };
}

export type RideFormState = { error?: string };

// datetime-local values are IST wall time (R4) — anchor them to +05:30 before storing.
function istInputToIso(value: string): string {
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/.exec(value);
  if (!m) return value;
  return new Date(`${m[1]}${m[2] ?? ":00"}+05:30`).toISOString();
}

function uniqueConstraint(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

const DIFFICULTIES = ["easy", "moderate", "hard"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// Every ride field is mandatory on create and on update (cover included at
// create via URL; on edit it lives in section 02). Returns an error or null.
function validateRideFields(fields: {
  title: string;
  description: string;
  startsAt: string;
  meetingPoint: string;
  distanceKm: string;
  difficulty: string;
}): string | null {
  const { title, description, startsAt, meetingPoint, distanceKm, difficulty } = fields;
  if (!title) return "Title is required.";
  if (title.length > 100) return "Title must be 100 characters or fewer.";
  if (!description) return "Description is required.";
  if (description.length > 2000) return "Description must be 2000 characters or fewer.";
  if (!startsAt) return "Start date and time are required.";
  if (!meetingPoint) return "Meeting point is required.";
  const distance = Number(distanceKm);
  if (!distanceKm || !Number.isFinite(distance) || distance <= 0) {
    return "Distance must be a number above 0 km.";
  }
  if (!DIFFICULTIES.includes(difficulty)) return "Pick a difficulty: easy, moderate or hard.";
  return null;
}

export async function createRide(
  _prev: RideFormState,
  formData: FormData,
): Promise<RideFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase, user } = admin;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const meetingPoint = String(formData.get("meeting_point") ?? "").trim();
  const distanceKm = String(formData.get("distance_km") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "");
  const status = String(formData.get("status") ?? "draft");
  const coverUrl = String(formData.get("cover_url") ?? "").trim();

  const fieldError = validateRideFields({ title, description, startsAt, meetingPoint, distanceKm, difficulty });
  if (fieldError) return { error: fieldError };

  // Cover is mandatory at create (no ride id exists yet for section 02).
  // URL-based so it works before R2 credentials land.
  if (!coverUrl) return { error: "Cover image URL is required." };
  const cover = await validateExternalImageUrl(coverUrl);
  if (!cover.ok) return { error: `Cover image: ${cover.error}` };

  const { error } = await supabase.from("events").insert({
    title,
    description,
    starts_at: istInputToIso(startsAt),
    meeting_point: meetingPoint,
    distance_km: Number(distanceKm),
    difficulty,
    status,
    cover_url: cover.info.url,
    slug: slugify(title),
    created_by: user.id,
  });

  if (error) {
    if (uniqueConstraint(error)) return { error: "A ride with that title already exists." };
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/rides");
  revalidatePath("/admin/rides");
  redirect("/admin/rides");
}

export async function updateRide(
  id: string,
  _prev: RideFormState,
  formData: FormData,
): Promise<RideFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const meetingPoint = String(formData.get("meeting_point") ?? "").trim();
  const distanceKm = String(formData.get("distance_km") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "");
  const status = String(formData.get("status") ?? "draft");

  const fieldError = validateRideFields({ title, description, startsAt, meetingPoint, distanceKm, difficulty });
  if (fieldError) return { error: fieldError };

  // slug is intentionally NOT updated — published links must stay stable.
  const { error } = await supabase
    .from("events")
    .update({
      title,
      description,
      starts_at: istInputToIso(startsAt),
      meeting_point: meetingPoint,
      distance_km: Number(distanceKm),
      difficulty,
      status,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const { data: fresh } = await supabase.from("events").select("slug").eq("id", id).maybeSingle();
  revalidateRidePaths(id, fresh?.slug ?? null);
  redirect("/admin/rides");
}

export async function deleteRide(id: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;
  const { data: ride } = await supabase.from("events").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (!error) {
    revalidatePath("/");
    revalidatePath("/rides");
    revalidatePath("/admin/rides");
    if (ride?.slug) revalidatePath(`/rides/${ride.slug}`);
  }
  return { ok: !error, error: error?.message };
}

export type MediaFormState = { error?: string; ok?: boolean };

export async function uploadRideCover(
  rideId: string,
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;
  if (!r2Configured()) return { error: "R2 not configured — add the R2_* env vars (.env.example)." };

  const file = formData.get("cover") as File | null;
  if (!file) return { error: "Choose an image first." };
  const invalid = await validateImageFile(file);
  if (invalid) return { error: invalid };

  const { data: ride } = await supabase
    .from("events")
    .select("id, slug, cover_url")
    .eq("id", rideId)
    .maybeSingle();
  if (!ride) return { error: "Ride not found." };

  const image = await processImage(file, 1600, 80);
  const key = `events/${rideId}/cover_${crypto.randomUUID()}.webp`;
  await putR2Object(key, image.data, "image/webp");

  const { error } = await supabase
    .from("events")
    .update({ cover_url: r2PublicUrl(key) })
    .eq("id", rideId);
  if (error) return { error: error.message };

  const oldKey = ride.cover_url ? r2KeyFromUrl(ride.cover_url) : null;
  if (oldKey) {
    try {
      await deleteR2Object(oldKey);
    } catch (e) {
      console.warn(`[admin] failed to delete old cover ${oldKey}:`, e);
    }
  }

  revalidateRidePaths(rideId, ride.slug);
  return { ok: true };
}

export async function uploadGalleryPhotos(
  rideId: string,
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;
  if (!r2Configured()) return { error: "R2 not configured — add the R2_* env vars (.env.example)." };

  const alt = String(formData.get("alt") ?? "").trim();
  if (!alt) return { error: "Alt text is required (describes the photo)." };
  if (alt.length > 200) return { error: "Alt text must be 200 characters or fewer." };

  const files = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
  if (files.length === 0) return { error: "Choose one or more images first." };

  for (const file of files) {
    const invalid = await validateImageFile(file);
    if (invalid) return { error: invalid };
  }

  const { data: ride } = await supabase
    .from("events")
    .select("id, slug")
    .eq("id", rideId)
    .maybeSingle();
  if (!ride) return { error: "Ride not found." };

  const rows: { event_id: string; url: string; thumb_url: string; mime: string; width: number; height: number; alt: string }[] = [];
  for (const file of files) {
    const uuid = crypto.randomUUID();
    const fullKey = `events/${rideId}/${uuid}.webp`;
    const thumbKey = `events/${rideId}/${uuid}_thumb.webp`;
    const [full, thumb] = await Promise.all([
      processImage(file, 2000, 80),
      processImage(file, 400, 75),
    ]);
    await Promise.all([
      putR2Object(fullKey, full.data, "image/webp"),
      putR2Object(thumbKey, thumb.data, "image/webp"),
    ]);
    rows.push({
      event_id: rideId,
      url: r2PublicUrl(fullKey),
      thumb_url: r2PublicUrl(thumbKey),
      mime: "image/webp",
      width: full.width,
      height: full.height,
      alt,
    });
  }

  const { error } = await supabase.from("gallery").insert(rows);
  if (error) return { error: error.message };

  revalidateRidePaths(rideId, ride.slug);
  return { ok: true };
}

// URL-based alternative to R2 uploads (06_MEDIA.md § URL-based photos) — no R2 config needed.
export async function addGalleryPhotoByUrl(
  rideId: string,
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  if (!alt) return { error: "Alt text is required (describes the photo)." };
  if (alt.length > 200) return { error: "Alt text must be 200 characters or fewer." };

  const { data: ride } = await supabase
    .from("events")
    .select("id, slug")
    .eq("id", rideId)
    .maybeSingle();
  if (!ride) return { error: "Ride not found." };

  const result = await validateExternalImageUrl(url);
  if (!result.ok) return { error: result.error };

  const { error } = await supabase.from("gallery").insert({
    event_id: rideId,
    url: result.info.url,
    thumb_url: result.info.url,
    mime: result.info.mime,
    width: result.info.width,
    height: result.info.height,
    alt,
  });
  if (error) return { error: error.message };

  revalidateRidePaths(rideId, ride.slug);
  return { ok: true };
}

export async function setRideCoverByUrl(
  rideId: string,
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  const url = String(formData.get("cover_url") ?? "").trim();
  const { data: ride } = await supabase
    .from("events")
    .select("id, slug, cover_url")
    .eq("id", rideId)
    .maybeSingle();
  if (!ride) return { error: "Ride not found." };

  const result = await validateExternalImageUrl(url);
  if (!result.ok) return { error: result.error };

  const { error } = await supabase
    .from("events")
    .update({ cover_url: result.info.url })
    .eq("id", rideId);
  if (error) return { error: error.message };

  const oldKey = ride.cover_url ? r2KeyFromUrl(ride.cover_url) : null;
  if (oldKey) {
    try {
      await deleteR2Object(oldKey);
    } catch (e) {
      console.warn(`[admin] failed to delete old cover ${oldKey}:`, e);
    }
  }

  revalidateRidePaths(rideId, ride.slug);
  return { ok: true };
}

export async function deleteMedia(mediaId: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;

  const { data: media } = await supabase
    .from("gallery")
    .select("url, thumb_url, event_id, events(slug)")
    .eq("id", mediaId)
    .maybeSingle();
  if (!media) return { ok: false, error: "Photo not found." };

  // Delete R2 objects only when the URLs belong to our bucket; demo/external links just drop the row.
  const keys = [media.url, media.thumb_url]
    .map((u) => r2KeyFromUrl(u))
    .filter((k): k is string => k !== null);
  if (keys.length > 0) {
    try {
      await Promise.all(keys.map((k) => deleteR2Object(k)));
    } catch (e) {
      console.warn(`[admin] failed to delete R2 objects for ${mediaId}:`, e);
    }
  }

  const { error } = await supabase.from("gallery").delete().eq("id", mediaId);
  if (!error) {
    const slug = (media.events as { slug?: string } | null)?.slug ?? null;
    revalidateRidePaths(media.event_id, slug);
  }
  return { ok: !error, error: error?.message };
}

export async function removeMember(rideId: string, userId: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;

  const { data: ride } = await supabase.from("events").select("slug").eq("id", rideId).maybeSingle();
  const { error } = await supabase
    .from("event_members")
    .delete()
    .eq("event_id", rideId)
    .eq("user_id", userId);

  if (!error) revalidateRidePaths(rideId, ride?.slug);
  return { ok: !error, error: error?.message };
}

export async function createAnnouncement(
  _prev: RideFormState,
  formData: FormData,
): Promise<RideFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase, user } = admin;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return { error: "Title is required." };
  if (title.length > 100) return { error: "Title must be 100 characters or fewer." };
  if (body.length > 2000) return { error: "Body must be 2000 characters or fewer." };

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    slug: slugify(title),
    created_by: user.id,
  });

  if (error) {
    if (uniqueConstraint(error)) return { error: "An announcement with that title already exists." };
    return { error: error.message };
  }

  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}

export async function updateAnnouncement(
  id: string,
  _prev: RideFormState,
  formData: FormData,
): Promise<RideFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return { error: "Title is required." };
  if (title.length > 100) return { error: "Title must be 100 characters or fewer." };
  if (body.length > 2000) return { error: "Body must be 2000 characters or fewer." };

  // slug stays stable so shared links keep working.
  const { error } = await supabase
    .from("announcements")
    .update({ title, body })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(id: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (!error) {
    revalidatePath("/announcements");
    revalidatePath("/admin/announcements");
  }
  return { ok: !error, error: error?.message };
}

// Membership approval: admin reviews the KYC + licence photo, then approves
// (registered = true — the trigger re-validates completeness) or rejects
// (back to the rider for fixes; resubmit re-queues). Approval purges the DL
// photo: it existed only to get verified, so the R2 object is deleted and the
// column nulled (the 0010 trigger exempts already-registered rows).
export async function approveRider(userId: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;
  const { data: row } = await supabase
    .from("rider_details")
    .select("dl_image_url")
    .eq("user_id", userId)
    .maybeSingle();
  const { error } = await supabase
    .from("rider_details")
    .update({ registered: true, kyc_rejected: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  const key = row?.dl_image_url ? r2KeyFromUrl(row.dl_image_url) : null;
  if (key) {
    try {
      await deleteR2Object(key);
    } catch (e) {
      console.warn(`[admin] failed to delete approved DL ${key}:`, e);
    }
  }
  // Null separately: same-statement nulling would trip the completeness check.
  // Approval stands even if this housekeeping fails (photo retention is the
  // safe direction); the warn keeps it visible.
  const { error: nullErr } = await supabase
    .from("rider_details")
    .update({ dl_image_url: null })
    .eq("user_id", userId);
  if (nullErr) console.warn(`[admin] DL purge column null failed for ${userId}:`, nullErr.message);
  revalidatePath("/admin/riders");
  revalidatePath(`/admin/riders/${userId}`);
  revalidatePath("/profile", "layout");
  return { ok: true };
}

export async function rejectRider(userId: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;
  const { error } = await supabase
    .from("rider_details")
    .update({ registered: false, kyc_rejected: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (!error) {
    revalidatePath("/admin/riders");
    revalidatePath(`/admin/riders/${userId}`);
    revalidatePath("/profile", "layout");
  }
  return { ok: !error, error: error?.message };
}

// Locked-field correction: the only path that can change a rider's frozen
// identity (dob/age, gender, blood group, DL number/signature/photo). Display
// name is a public label riders edit themselves — not handled here. Full
// values are always written (the form is prefilled), so the KYC trigger stays
// satisfied on registered rows.
export async function updateLockedFields(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };
  const { supabase } = admin;

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Missing rider id." };

  const dobRaw = String(formData.get("dob") ?? "").trim();
  const gender = String(formData.get("gender") ?? "");
  const bloodGroup = String(formData.get("blood_group") ?? "");
  const drivingLicence = String(formData.get("driving_licence") ?? "").trim().toUpperCase();
  const digitalSignature = String(formData.get("digital_signature") ?? "").trim();

  const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
  if (!GENDERS.includes(gender)) return { error: "Pick a valid gender option." };

  const age = ageFromDob(dobRaw);
  if (age == null || !Number.isInteger(age) || age < 18 || age > 90) {
    return { error: "Enter a valid date of birth — the rider must be 18–90 years old." };
  }
  if (!BLOOD_GROUPS.includes(bloodGroup)) return { error: "Pick a valid blood group." };
  if (!drivingLicence) return { error: "Driving licence number is required." };
  if (!digitalSignature) return { error: "Full name / digital signature is required." };

  const { data: current } = await supabase
    .from("rider_details")
    .select("registered, dl_image_url")
    .eq("user_id", userId)
    .maybeSingle();
  if (!current) return { error: "Rider details not found." };

  // Approved rows hold no photo (purged at approval) — nothing to replace.
  let nextDlUrl: string | null = current.dl_image_url ?? null;
  const dlFile = formData.get("dl_photo") as File | null;
  if (!current.registered && dlFile && dlFile.size > 0) {
    if (!r2Configured()) return { error: "R2 not configured — add the R2_* env vars (.env.example)." };
    const invalid = await validateImageFile(dlFile);
    if (invalid) return { error: `Licence photo: ${invalid}` };
    const image = await processImage(dlFile, 1600, 80);
    const key = `rider-docs/${userId}/dl_${crypto.randomUUID()}.webp`;
    await putR2Object(key, image.data, "image/webp");
    const oldKey = nextDlUrl ? r2KeyFromUrl(nextDlUrl) : null;
    if (oldKey) {
      try {
        await deleteR2Object(oldKey);
      } catch (e) {
        console.warn(`[admin] failed to delete replaced DL ${oldKey}:`, e);
      }
    }
    nextDlUrl = r2PublicUrl(key);
  }

  const { error: rErr } = await supabase
    .from("rider_details")
    .update({
      age,
      dob: dobRaw || null,
      gender,
      blood_group: bloodGroup,
      driving_licence: drivingLicence,
      digital_signature: digitalSignature,
      dl_image_url: nextDlUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (rErr) return { error: rErr.message };

  revalidatePath("/admin/riders");
  revalidatePath(`/admin/riders/${userId}`);
  revalidatePath("/profile", "layout");
  return { ok: true };
}

function revalidateRidePaths(rideId: string, slug: string | null | undefined) {
  revalidatePath("/");
  revalidatePath("/rides");
  revalidatePath("/admin/rides");
  revalidatePath(`/rides/${slug ?? rideId}`);
  revalidatePath(`/admin/rides/${rideId}/edit`);
}
