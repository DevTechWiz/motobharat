"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import { processImage, validateImageFile } from "@/lib/media";
import { deleteR2Object, putR2Object, r2Configured, r2KeyFromUrl, r2PublicUrl } from "@/lib/r2";

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

export async function createRide(
  _prev: RideFormState,
  formData: FormData,
): Promise<RideFormState> {
  const { supabase, user } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const meetingPoint = String(formData.get("meeting_point") ?? "").trim();
  const distanceKm = String(formData.get("distance_km") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "");
  const status = String(formData.get("status") ?? "draft");

  if (!title || !startsAt) return { error: "Title and start time are required." };
  if (title.length > 100) return { error: "Title must be 100 characters or fewer." };
  if (description.length > 2000) return { error: "Description must be 2000 characters or fewer." };

  const { error } = await supabase.from("events").insert({
    title,
    description,
    starts_at: istInputToIso(startsAt),
    meeting_point: meetingPoint,
    distance_km: distanceKm ? Number(distanceKm) : null,
    difficulty: difficulty || null,
    status,
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
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const meetingPoint = String(formData.get("meeting_point") ?? "").trim();
  const distanceKm = String(formData.get("distance_km") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "");
  const status = String(formData.get("status") ?? "draft");

  if (!title || !startsAt) return { error: "Title and start time are required." };
  if (title.length > 100) return { error: "Title must be 100 characters or fewer." };
  if (description.length > 2000) return { error: "Description must be 2000 characters or fewer." };

  // slug is intentionally NOT updated — published links must stay stable.
  const { error } = await supabase
    .from("events")
    .update({
      title,
      description,
      starts_at: istInputToIso(startsAt),
      meeting_point: meetingPoint,
      distance_km: distanceKm ? Number(distanceKm) : null,
      difficulty: difficulty || null,
      status,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const { data: fresh } = await supabase.from("events").select("slug").eq("id", id).maybeSingle();
  revalidateRidePaths(id, fresh?.slug ?? null);
  redirect("/admin/rides");
}

export async function deleteRide(id: string) {
  const { supabase } = await requireAdmin();
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
  const { supabase } = await requireAdmin();
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
  const { supabase } = await requireAdmin();
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

export async function deleteMedia(mediaId: string) {
  const { supabase } = await requireAdmin();

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
  const { supabase } = await requireAdmin();

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
  const { supabase, user } = await requireAdmin();

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
  const { supabase } = await requireAdmin();

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
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (!error) {
    revalidatePath("/announcements");
    revalidatePath("/admin/announcements");
  }
  return { ok: !error, error: error?.message };
}

function revalidateRidePaths(rideId: string, slug: string | null | undefined) {
  revalidatePath("/");
  revalidatePath("/rides");
  revalidatePath("/admin/rides");
  revalidatePath(`/rides/${slug ?? rideId}`);
  revalidatePath(`/admin/rides/${rideId}/edit`);
}
