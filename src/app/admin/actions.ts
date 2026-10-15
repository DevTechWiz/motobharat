"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ageFromDob, slugify } from "@/lib/format";
import { processImage, validateImageFile } from "@/lib/media";
import { validateExternalImageUrl } from "@/lib/url-image";
import { deleteR2Object, putR2Object, r2Configured, r2KeyFromUrl, r2NotConfiguredError, r2PublicUrl } from "@/lib/r2";
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

export type RideFormState = { error?: string; ok?: boolean; next?: string; id?: string };

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

// Sanitizers (not validators): malformed optionals degrade to null so draft
// saves always land. Publishing still validates everything up front.
function cleanDistance(raw: string): number | null {
  const v = raw.trim();
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null;
}

function cleanDifficulty(raw: string): string | null {
  return DIFFICULTIES.includes(raw) ? raw : null;
}

// Every ride field is mandatory on create and on update (cover included at
// create via URL; on edit it lives in section 02). Returns an error or null.
function validateRideFields(
  fields: {
    title: string;
    description: string;
    startsAt: string;
    meetingPoint: string;
    distanceKm: string;
    difficulty: string;
  },
  draft = false
): string | null {
  const { title, description, startsAt, meetingPoint, distanceKm, difficulty } = fields;
  if (!title) return "Title is required.";
  if (title.length > 100) return "Title must be 100 characters or fewer.";
  if (description.length > 2000) return "Description must be 2000 characters or fewer.";
  // Drafts are unpublished: title + length caps only. Malformed optionals
  // degrade to null/defaults at write time instead of erroring.
  if (draft) return null;
  if (!description) return "Description is required.";
  if (!startsAt) return "Start date and time are required.";
  if (!meetingPoint) return "Meeting point is required.";
  const distance = Number(distanceKm);
  if (!distanceKm || !Number.isFinite(distance) || distance <= 0) {
    return "Distance must be a number above 0 km.";
  }
  if (!DIFFICULTIES.includes(difficulty)) return "Pick a difficulty: easy, moderate or hard.";
  return null;
}

function parseItinerary(raw: string): { title: string; description?: string; activity?: string }[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => typeof item?.title === "string" && item.title.trim())
        .map((item) => ({
          title: item.title.trim(),
          description: typeof item.description === "string" ? item.description.trim() : "",
          activity: typeof item.activity === "string" ? item.activity.trim() : "",
        }));
    }
  } catch {
    // fallback
  }
  return [];
}

function parseActivities(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim());
    }
  } catch {
    // fallback
  }
  return [];
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
  const destination = String(formData.get("destination") ?? "").trim() || null;
  const itinerary = parseItinerary(String(formData.get("itinerary") ?? "[]"));
  const activities = parseActivities(String(formData.get("activities") ?? "[]"));
  const distanceKm = String(formData.get("distance_km") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "");
  const status = String(formData.get("status") ?? "draft");

  const fieldError = validateRideFields({ title, description, startsAt, meetingPoint, distanceKm, difficulty }, status === "draft");
  if (fieldError) return { error: fieldError };

  // Cover at create is upload-only: a file, or nothing for drafts.
  const coverFile = formData.get("cover_file") as File | null;
  const coverPick = coverFile && coverFile.size > 0 ? coverFile : null;
  let coverUrlFinal: string | null = null;
  let newId: string | null = null;
  let uploadedCoverKey: string | null = null;
  if (coverPick) {
    if (!r2Configured()) {
      return { error: r2NotConfiguredError("Cover photo can't be saved — photo storage isn't connected") };
    }
    const invalid = await validateImageFile(coverPick);
    if (invalid) return { error: `Cover photo: ${invalid}` };
    newId = crypto.randomUUID();
    const image = await processImage(coverPick, 2000, 80);
    const key = `events/${newId}/cover_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);
    uploadedCoverKey = key;
    coverUrlFinal = r2PublicUrl(key);
  } else if (status !== "draft") {
    return { error: "Cover photo is required — upload one to publish." };
  }

  const insertPayload = {
    ...(newId ? { id: newId } : {}),
    title,
    description,
    starts_at: startsAt ? istInputToIso(startsAt) : new Date().toISOString(),
    meeting_point: meetingPoint,
    destination,
    itinerary,
    activities,
    distance_km: cleanDistance(distanceKm),
    difficulty: cleanDifficulty(difficulty),
    status,
    cover_url: coverUrlFinal,
    slug: slugify(title),
    created_by: user.id,
  };

  let { error, data: created } = await supabase.from("events").insert(insertPayload)
    .select("id")
    .single();

  // Graceful fallback if activities column has not yet been applied
  if (error && (error.code === "42703" || error.message?.includes("activities"))) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activities: _omit, ...payloadWithoutActivities } = insertPayload;
    const retry = await supabase.from("events").insert(payloadWithoutActivities)
      .select("id")
      .single();
    error = retry.error;
    created = retry.data;
  }

  if (error) {
    if (uploadedCoverKey) {
      try {
        await deleteR2Object(uploadedCoverKey);
      } catch (e) {
        console.warn(`[admin] failed to clean up orphan cover ${uploadedCoverKey}:`, e);
      }
    }
    if (uniqueConstraint(error)) return { error: "A ride with that title already exists." };
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/rides");
  revalidatePath("/admin/rides");
  // Hand off to the edit page: details, cover, gallery and members are the
  // exact same sections for new and existing rides — never duplicated.
  const editId = created?.id;
  return { ok: true, next: editId ? `/admin/rides/${editId}/edit` : "/admin/rides", id: editId ?? undefined };
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
  const destination = String(formData.get("destination") ?? "").trim() || null;
  const activities = parseActivities(String(formData.get("activities") ?? "[]"));
  const distanceKm = String(formData.get("distance_km") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "");
  const status = String(formData.get("status") ?? "draft");

  const fieldError = validateRideFields({ title, description, startsAt, meetingPoint, distanceKm, difficulty }, status === "draft");
  if (fieldError) return { error: fieldError };

  const coverFile = formData.get("cover_file") as File | null;
  const coverPick = coverFile && coverFile.size > 0 ? coverFile : null;

  let newCoverUrl: string | null = null;
  let newCoverKey: string | null = null;
  if (coverPick) {
    if (!r2Configured()) {
      return { error: r2NotConfiguredError("Cover photo can't be saved — photo storage isn't connected") };
    }
    const invalid = await validateImageFile(coverPick);
    if (invalid) return { error: `Cover photo: ${invalid}` };
    const image = await processImage(coverPick, 2000, 80);
    const key = `events/${id}/cover_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);
    newCoverKey = key;
    newCoverUrl = r2PublicUrl(key);
  }

  const { data: current } = await supabase
    .from("events")
    .select("cover_url, starts_at, slug")
    .eq("id", id)
    .maybeSingle();

  // Drafts keep the stored date when the field is cleared; publishing needs one.
  let startsAtIso: string;
  if (startsAt) {
    startsAtIso = istInputToIso(startsAt);
  } else if (status !== "draft") {
    return { error: "Start date and time are required." };
  } else {
    startsAtIso = current?.starts_at ?? new Date().toISOString();
  }

  const effectiveCover = newCoverUrl ?? current?.cover_url ?? null;

  // Publishing needs a stored cover; drafts don't.
  if (status !== "draft" && !effectiveCover) {
    return { error: "Cover photo is required — upload one to publish." };
  }

  const hasItinerary = formData.has("itinerary");
  const itinerary = hasItinerary ? parseItinerary(String(formData.get("itinerary"))) : undefined;

  const updatePayload: Record<string, unknown> = {
    title,
    description,
    starts_at: startsAtIso,
    meeting_point: meetingPoint,
    destination,
    activities,
    distance_km: cleanDistance(distanceKm),
    difficulty: cleanDifficulty(difficulty),
    status,
    ...(hasItinerary ? { itinerary } : {}),
    ...(newCoverUrl ? { cover_url: newCoverUrl } : {}),
  };

  // slug is intentionally NOT updated — published links must stay stable.
  let { data: updated, error } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  // Graceful fallback if activities column has not yet been applied
  if (error && (error.code === "42703" || error.message?.includes("activities"))) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activities: _omit, ...payloadWithoutActivities } = updatePayload;
    const retry = await supabase
      .from("events")
      .update(payloadWithoutActivities)
      .eq("id", id)
      .select("slug")
      .maybeSingle();
    updated = retry.data;
    error = retry.error;
  }

  if (error) {
    if (newCoverKey) {
      try {
        await deleteR2Object(newCoverKey);
      } catch (e) {
        console.warn(`[admin] failed to clean up orphan cover ${newCoverKey}:`, e);
      }
    }
    return { error: error.message };
  }

  if (newCoverUrl && current?.cover_url) {
    const oldKey = r2KeyFromUrl(current.cover_url);
    if (oldKey) {
      try {
        await deleteR2Object(oldKey);
      } catch (e) {
        console.warn(`[admin] failed to delete old cover ${oldKey}:`, e);
      }
    }
  }

  revalidateRidePaths(id, updated?.slug ?? current?.slug ?? null);
  return { ok: true };
}

export async function updateRideItinerary(
  rideId: string,
  itinerary: { title: string; description?: string; activity?: string }[]
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;

  const validStops = itinerary
    .filter((s) => s.title.trim())
    .map((s) => ({
      title: s.title.trim(),
      description: s.description?.trim() || "",
      activity: s.activity?.trim() || "",
    }));

  const { data: ride } = await supabase
    .from("events")
    .select("slug")
    .eq("id", rideId)
    .maybeSingle();

  if (!ride) return { ok: false, error: "Ride not found." };

  const { error } = await supabase
    .from("events")
    .update({ itinerary: validStops })
    .eq("id", rideId);

  if (error) return { ok: false, error: error.message };

  revalidateRidePaths(rideId, ride.slug);
  return { ok: true };
}

export async function deleteRide(id: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;
  const { data: ride } = await supabase.from("events").select("slug, cover_url").eq("id", id).maybeSingle();
  const { data: photos } = await supabase.from("gallery").select("url, thumb_url").eq("event_id", id);
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (!error) {
    const keys = [ride?.cover_url, ...(photos ?? []).flatMap((p) => [p.url, p.thumb_url])]
      .map((u) => (u ? r2KeyFromUrl(u) : null))
      .filter((k): k is string => k !== null);
    if (keys.length > 0) {
      try {
        await Promise.all(keys.map((k) => deleteR2Object(k)));
      } catch (e) {
        console.warn(`[admin] failed to delete R2 objects for ride ${id}:`, e);
      }
    }
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

  try {
  if (!r2Configured()) return { error: r2NotConfiguredError("Cover photo can't be saved — photo storage isn't connected") };

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
    const key = `events/${rideId}/cover_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload cover photo.";
    console.error("[admin] uploadRideCover failed:", err);
    return { error: message };
  }
}

export async function removeRideCover(rideId: string): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  try {
    const { data: ride } = await supabase
      .from("events")
      .select("id, slug, cover_url")
      .eq("id", rideId)
      .maybeSingle();
    if (!ride) return { error: "Ride not found." };

    const { error } = await supabase
      .from("events")
      .update({ cover_url: null })
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove cover photo.";
    console.error("[admin] removeRideCover failed:", err);
    return { error: message };
  }
}


export async function uploadGalleryPhotos(
  rideId: string,
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  try {
  if (!r2Configured()) return { error: r2NotConfiguredError("Gallery photo can't be saved — photo storage isn't connected") };

  const alt = String(formData.get("alt") ?? "").trim() || "Ride photo";
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
      const [full, thumb] = await Promise.all([
        processImage(file, 2000, 80),
        processImage(file, 400, 75),
      ]);
      const fullKey = `events/${rideId}/${uuid}.${full.format}`;
      const thumbKey = `events/${rideId}/${uuid}_thumb.${thumb.format}`;
      await Promise.all([
        putR2Object(fullKey, full.data, full.contentType),
        putR2Object(thumbKey, thumb.data, thumb.contentType),
      ]);
      rows.push({
        event_id: rideId,
        url: r2PublicUrl(fullKey),
        thumb_url: r2PublicUrl(thumbKey),
        mime: full.contentType,
        width: full.width,
        height: full.height,
        alt,
      });
    }

    const { error } = await supabase.from("gallery").insert(rows);
    if (error) return { error: error.message };

    revalidateRidePaths(rideId, ride.slug);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload gallery photos.";
    console.error("[admin] uploadGalleryPhotos failed:", err);
    return { error: message };
  }
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
  if (!url) return { error: "Image URL is required." };
  const alt = String(formData.get("alt") ?? "").trim() || "Ride photo";
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
    thumb_url: result.info.thumbUrl,
    mime: result.info.mime,
    width: result.info.width,
    height: result.info.height,
    alt,
  });
  if (error) return { error: error.message };

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

  // DB row goes first so a failed delete never strands the row pointing at
  // gone objects; R2 cleanup is best-effort after the row is gone.
  const { error } = await supabase.from("gallery").delete().eq("id", mediaId);
  if (!error) {
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
  })
    .select("id")
    .single();

  if (error) {
    if (uniqueConstraint(error)) return { error: "An announcement with that title already exists." };
    return { error: error.message };
  }

  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  return { ok: true, next: "/admin/announcements" };
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
  return { ok: true, next: "/admin/announcements" };
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
  let newDlKey: string | null = null;
  const oldDlKey = nextDlUrl ? r2KeyFromUrl(nextDlUrl) : null;
  const dlFile = formData.get("dl_photo") as File | null;
  if (!current.registered && dlFile && dlFile.size > 0) {
    if (!r2Configured()) return { error: r2NotConfiguredError("Licence photo can't be saved — photo storage isn't connected") };
    const invalid = await validateImageFile(dlFile);
    if (invalid) return { error: `Licence photo: ${invalid}` };
    const image = await processImage(dlFile, 1600, 80);
    const key = `rider-docs/${userId}/dl_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);
    newDlKey = key;
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
  if (rErr) {
    if (newDlKey) {
      try {
        await deleteR2Object(newDlKey);
      } catch (e) {
        console.warn(`[admin] failed to clean up orphan DL ${newDlKey}:`, e);
      }
    }
    return { error: rErr.message };
  }
  if (newDlKey && oldDlKey) {
    try {
      await deleteR2Object(oldDlKey);
    } catch (e) {
      console.warn(`[admin] failed to delete replaced DL ${oldDlKey}:`, e);
    }
  }

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

export async function fetchRemoteImageDataUrl(url: string): Promise<{ dataUrl?: string; error?: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { error: "Failed to download image." };
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const b64 = Buffer.from(buf).toString("base64");
    return { dataUrl: `data:${contentType};base64,${b64}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not fetch image.";
    return { error: message };
  }
}

