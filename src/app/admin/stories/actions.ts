"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, type RideFormState, type MediaFormState } from "@/app/admin/actions";
import {
  putR2Object,
  deleteR2Object,
  r2PublicUrl,
  r2KeyFromUrl,
  r2Configured,
  r2NotConfiguredError,
} from "@/lib/r2";
import { processImage, validateImageFile } from "@/lib/media";
import { slugify } from "@/lib/format";

export async function createStory(
  _prev: RideFormState,
  formData: FormData
): Promise<RideFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase, user } = admin;

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "achievement").trim();
  let coverUrl = String(formData.get("cover_url") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const riderName = String(formData.get("rider_name") ?? "").trim() || null;
  const riderBike = String(formData.get("rider_bike") ?? "").trim() || null;
  const author = String(formData.get("author") ?? "Team Moto Bharat").trim() || "Team Moto Bharat";
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)
    : [];
  const statsRaw = String(formData.get("stats") ?? "[]");
  const photosRaw = String(formData.get("photos") ?? "[]");

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or fewer." };
  if (subtitle && subtitle.length > 300) {
    return { error: "Subtitle must be 300 characters or fewer." };
  }
  if (!content) return { error: "Story narrative / content is required." };

  let stats = [];
  try {
    stats = JSON.parse(statsRaw);
  } catch {}

  let photos: { url: string; thumb?: string; caption?: string }[] = [];
  try {
    photos = JSON.parse(photosRaw);
  } catch {}
  photos = photos.filter(
    (p) => Boolean(p && typeof p.url === "string" && !p.url.startsWith("blob:") && !p.url.startsWith("data:"))
  );

  const storyId = crypto.randomUUID();

  // Handle direct cover file upload if provided
  const coverFile = formData.get("cover_file") as File | null;
  if (!coverUrl && (!coverFile || coverFile.size === 0)) {
    return { error: "Cover photo is mandatory. Please upload and crop a 16:9 cover photo." };
  }
  if (coverFile && coverFile.size > 0) {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Cover photo can't be saved — photo storage isn't connected") };
    }
    const invalid = await validateImageFile(coverFile);
    if (invalid) return { error: `Cover photo: ${invalid}` };
    const image = await processImage(coverFile, 2000, 80);
    const key = `stories/${storyId}/cover_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);
    coverUrl = r2PublicUrl(key);
  }

  // Handle direct gallery files upload if provided
  const galleryFiles = (formData.getAll("gallery_files") as File[]).filter((f) => f && f.size > 0);
  if (galleryFiles.length > 0) {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Gallery photos can't be saved — photo storage isn't connected") };
    }
    for (const file of galleryFiles) {
      const invalid = await validateImageFile(file);
      if (invalid) return { error: `Gallery photo: ${invalid}` };
    }
    for (const file of galleryFiles) {
      const uuid = crypto.randomUUID();
      const [full, thumb] = await Promise.all([
        processImage(file, 2000, 80),
        processImage(file, 400, 75),
      ]);
      const fullKey = `stories/${storyId}/${uuid}.${full.format}`;
      const thumbKey = `stories/${storyId}/${uuid}_thumb.${thumb.format}`;
      await Promise.all([
        putR2Object(fullKey, full.data, full.contentType),
        putR2Object(thumbKey, thumb.data, thumb.contentType),
      ]);
      photos.push({
        url: r2PublicUrl(fullKey),
        thumb: r2PublicUrl(thumbKey),
        caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      });
    }
  }

  // Generate unique slug (allow custom slug if specified)
  const customSlug = String(formData.get("slug") ?? "").trim();
  const baseSlug = slugify(customSlug || title);
  let slug = baseSlug;
  const { data: existing } = await supabase
    .from("stories")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const { error } = await supabase.from("stories").insert({
    id: storyId,
    title,
    slug,
    subtitle,
    category,
    cover_url: coverUrl,
    content,
    rider_name: riderName,
    rider_bike: riderBike,
    author,
    tags,
    stats,
    photos,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/stories");
  revalidatePath(`/stories/${slug}`);
  revalidatePath("/admin/stories");
  return { ok: true, id: storyId, next: "/admin/stories" };
}

export async function updateStory(
  id: string,
  _prev: RideFormState,
  formData: FormData
): Promise<RideFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "achievement").trim();
  let coverUrl = String(formData.get("cover_url") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const riderName = String(formData.get("rider_name") ?? "").trim() || null;
  const riderBike = String(formData.get("rider_bike") ?? "").trim() || null;
  const author = String(formData.get("author") ?? "Team Moto Bharat").trim() || "Team Moto Bharat";
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)
    : [];
  const statsRaw = String(formData.get("stats") ?? "[]");
  const photosRaw = String(formData.get("photos") ?? "[]");

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or fewer." };
  if (subtitle && subtitle.length > 300) {
    return { error: "Subtitle must be 300 characters or fewer." };
  }
  if (!content) return { error: "Story narrative / content is required." };

  let stats = [];
  try {
    stats = JSON.parse(statsRaw);
  } catch {}

  let photos: { url: string; thumb?: string; caption?: string }[] = [];
  try {
    photos = JSON.parse(photosRaw);
  } catch {}
  photos = photos.filter(
    (p) => Boolean(p && typeof p.url === "string" && !p.url.startsWith("blob:") && !p.url.startsWith("data:"))
  );

  const { data: current } = await supabase
    .from("stories")
    .select("slug, cover_url")
    .eq("id", id)
    .maybeSingle();

  // Handle direct cover file upload if provided
  const coverFile = formData.get("cover_file") as File | null;
  if (!coverUrl && (!coverFile || coverFile.size === 0)) {
    return { error: "Cover photo is mandatory. Please upload and crop a 16:9 cover photo." };
  }
  if (coverFile && coverFile.size > 0) {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Cover photo can't be saved — photo storage isn't connected") };
    }
    const invalid = await validateImageFile(coverFile);
    if (invalid) return { error: `Cover photo: ${invalid}` };
    const image = await processImage(coverFile, 2000, 80);
    const key = `stories/${id}/cover_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);
    coverUrl = r2PublicUrl(key);

    // Clean up old cover from R2
    const oldKey = current?.cover_url ? r2KeyFromUrl(current.cover_url) : null;
    if (oldKey) {
      try {
        await deleteR2Object(oldKey);
      } catch (e) {
        console.warn(`[admin] failed to delete old cover ${oldKey}:`, e);
      }
    }
  }

  // Handle direct gallery files upload if provided
  const galleryFiles = (formData.getAll("gallery_files") as File[]).filter((f) => f && f.size > 0);
  if (galleryFiles.length > 0) {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Gallery photos can't be saved — photo storage isn't connected") };
    }
    for (const file of galleryFiles) {
      const invalid = await validateImageFile(file);
      if (invalid) return { error: `Gallery photo: ${invalid}` };
    }
    for (const file of galleryFiles) {
      const uuid = crypto.randomUUID();
      const [full, thumb] = await Promise.all([
        processImage(file, 2000, 80),
        processImage(file, 400, 75),
      ]);
      const fullKey = `stories/${id}/${uuid}.${full.format}`;
      const thumbKey = `stories/${id}/${uuid}_thumb.${thumb.format}`;
      await Promise.all([
        putR2Object(fullKey, full.data, full.contentType),
        putR2Object(thumbKey, thumb.data, thumb.contentType),
      ]);
      photos.push({
        url: r2PublicUrl(fullKey),
        thumb: r2PublicUrl(thumbKey),
        caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      });
    }
  }

  const customSlug = String(formData.get("slug") ?? "").trim();
  const nextSlug = customSlug ? slugify(customSlug) : current?.slug;

  const { error } = await supabase
    .from("stories")
    .update({
      title,
      slug: nextSlug,
      subtitle,
      category,
      cover_url: coverUrl,
      content,
      rider_name: riderName,
      rider_bike: riderBike,
      author,
      tags,
      stats,
      photos,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/stories");
  if (current?.slug) revalidatePath(`/stories/${current.slug}`);
  if (nextSlug && nextSlug !== current?.slug) revalidatePath(`/stories/${nextSlug}`);
  revalidatePath("/admin/stories");
  return { ok: true, id, next: "/admin/stories" };
}

export async function uploadStoryCover(
  storyId: string,
  _prev: MediaFormState,
  formData: FormData
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  try {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Cover photo can't be saved — photo storage isn't connected") };
    }

    const file = formData.get("cover") as File | null;
    if (!file || file.size === 0) return { error: "Choose an image first." };

    const invalid = await validateImageFile(file);
    if (invalid) return { error: invalid };

    const { data: story } = await supabase
      .from("stories")
      .select("id, slug, cover_url")
      .eq("id", storyId)
      .maybeSingle();
    if (!story) return { error: "Story not found." };

    const image = await processImage(file, 2000, 80);
    const key = `stories/${storyId}/cover_${crypto.randomUUID()}.${image.format}`;
    await putR2Object(key, image.data, image.contentType);

    const newUrl = r2PublicUrl(key);
    const { error } = await supabase
      .from("stories")
      .update({ cover_url: newUrl })
      .eq("id", storyId);
    if (error) return { error: error.message };

    const oldKey = story.cover_url ? r2KeyFromUrl(story.cover_url) : null;
    if (oldKey) {
      try {
        await deleteR2Object(oldKey);
      } catch (e) {
        console.warn(`[admin] failed to delete old story cover ${oldKey}:`, e);
      }
    }

    revalidatePath("/");
    revalidatePath("/stories");
    if (story.slug) revalidatePath(`/stories/${story.slug}`);
    revalidatePath("/admin/stories");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload cover photo.";
    return { error: message };
  }
}

export async function removeStoryCover(_storyId?: string): Promise<MediaFormState> {
  void _storyId;
  return {
    error: "Cover photo is mandatory for stories. Select or crop a new photo to replace the existing cover.",
  };
}

export async function uploadStoryGalleryPhotos(
  storyId: string,
  _prev: MediaFormState,
  formData: FormData
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  try {
    if (!(await r2Configured())) {
      return { error: r2NotConfiguredError("Gallery photo can't be saved — photo storage isn't connected") };
    }

    const files = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
    if (files.length === 0) return { error: "Choose one or more images first." };

    for (const file of files) {
      const invalid = await validateImageFile(file);
      if (invalid) return { error: invalid };
    }

    const { data: story } = await supabase
      .from("stories")
      .select("id, slug, photos")
      .eq("id", storyId)
      .maybeSingle();
    if (!story) return { error: "Story not found." };

    const currentPhotos = (
      Array.isArray(story.photos) ? story.photos : []
    ).filter(
      (p): p is { url: string; thumb?: string; caption?: string } =>
        Boolean(p && typeof p.url === "string" && !p.url.startsWith("blob:") && !p.url.startsWith("data:"))
    );
    const newPhotos: { url: string; thumb: string; caption: string }[] = [];

    for (const file of files) {
      const uuid = crypto.randomUUID();
      const [full, thumb] = await Promise.all([
        processImage(file, 2000, 80),
        processImage(file, 400, 75),
      ]);
      const fullKey = `stories/${storyId}/${uuid}.${full.format}`;
      const thumbKey = `stories/${storyId}/${uuid}_thumb.${thumb.format}`;

      await Promise.all([
        putR2Object(fullKey, full.data, full.contentType),
        putR2Object(thumbKey, thumb.data, thumb.contentType),
      ]);

      newPhotos.push({
        url: r2PublicUrl(fullKey),
        thumb: r2PublicUrl(thumbKey),
        caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      });
    }

    const updated = [...currentPhotos, ...newPhotos];
    const { error } = await supabase
      .from("stories")
      .update({ photos: updated })
      .eq("id", storyId);
    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath("/stories");
    if (story.slug) revalidatePath(`/stories/${story.slug}`);
    revalidatePath("/admin/stories");
    return { ok: true, photos: newPhotos };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload gallery photos.";
    return { error: message };
  }
}

export async function deleteStoryGalleryPhoto(
  storyId: string,
  photoUrl: string
): Promise<MediaFormState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;
  const { supabase } = admin;

  try {
    const { data: story } = await supabase
      .from("stories")
      .select("id, slug, photos")
      .eq("id", storyId)
      .maybeSingle();
    if (!story) return { error: "Story not found." };

    const currentPhotos = (Array.isArray(story.photos) ? story.photos : []) as { url: string; thumb?: string; caption?: string }[];
    const target = currentPhotos.find((p) => p.url === photoUrl || p.thumb === photoUrl);
    const updated = currentPhotos.filter((p) => p.url !== photoUrl && p.thumb !== photoUrl);

    const { error } = await supabase
      .from("stories")
      .update({ photos: updated })
      .eq("id", storyId);
    if (error) return { error: error.message };

    if (target?.url) {
      const key = r2KeyFromUrl(target.url);
      if (key) {
        try {
          await deleteR2Object(key);
        } catch {}
      }
    }
    if (target?.thumb) {
      const key = r2KeyFromUrl(target.thumb);
      if (key) {
        try {
          await deleteR2Object(key);
        } catch {}
      }
    }

    revalidatePath("/");
    revalidatePath("/stories");
    if (story.slug) revalidatePath(`/stories/${story.slug}`);
    revalidatePath("/admin/stories");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete gallery photo.";
    return { error: message };
  }
}

export async function deleteStory(id: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };
  const { supabase } = admin;

  const { data: story } = await supabase
    .from("stories")
    .select("cover_url, slug, photos")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (!error) {
    if (story?.cover_url) {
      const key = r2KeyFromUrl(story.cover_url);
      if (key) {
        try {
          await deleteR2Object(key);
        } catch {}
      }
    }
    if (Array.isArray(story?.photos)) {
      for (const p of story.photos as { url?: string; thumb?: string }[]) {
        if (p.url) {
          const k = r2KeyFromUrl(p.url);
          if (k) {
            try {
              await deleteR2Object(k);
            } catch {}
          }
        }
        if (p.thumb) {
          const k = r2KeyFromUrl(p.thumb);
          if (k) {
            try {
              await deleteR2Object(k);
            } catch {}
          }
        }
      }
    }
    revalidatePath("/");
    revalidatePath("/stories");
    if (story?.slug) revalidatePath(`/stories/${story.slug}`);
    revalidatePath("/admin/stories");
  }

  return { ok: !error, error: error?.message };
}
