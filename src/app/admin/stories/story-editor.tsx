"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ArrowLeft,
  ExternalLink,
  Camera,
  Crop,
  Loader2,
  UploadCloud,
  Images,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { CustomSelect } from "@/components/ui/custom-select";
import { AdminSection } from "@/app/admin/rides/admin-section";
import { CoverCropperModal } from "@/components/admin/cover-cropper-modal";
import {
  compressImageFile,
  friendlyUploadError,
  ACCEPTED_IMAGE_TYPES,
  IMAGE_UPLOAD_HINT,
} from "@/lib/client-image";
import {
  uploadStoryCover,
  uploadStoryGalleryPhotos,
  deleteStoryGalleryPhoto,
} from "./actions";
import type { RideFormState, MediaFormState } from "@/app/admin/actions";
import type { Story, StoryCategory, StoryStat, StoryPhoto } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { value: "achievement", label: "Achievement", sublabel: "Endurance runs, records, certificates" },
  { value: "tour_story", label: "Tour Story", sublabel: "Long-distance travelogue, expedition" },
  { value: "milestone", label: "Milestone", sublabel: "Club anniversary, km milestone" },
  { value: "spotlight", label: "Rider Spotlight", sublabel: "Member feature, special contribution" },
];

export function StoryEditor({
  story,
  action,
}: {
  story?: Story;
  action: (prev: RideFormState, formData: FormData) => Promise<RideFormState>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, {} as RideFormState);
  const [isPending, startTransition] = useTransition();

  const [category, setCategory] = useState<StoryCategory>(story?.category ?? "achievement");

  // Cover photo state (matching RideForm)
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(story?.cover_url ?? null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [rawCoverFile, setRawCoverFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [coverState, setCoverState] = useState<MediaFormState>({});
  const [isUploadingCover, startCoverTransition] = useTransition();
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Gallery Photos state (matching GalleryManager)
  const [existingPhotos, setExistingPhotos] = useState<StoryPhoto[]>(() =>
    (story?.photos ?? []).filter(
      (p) => p && typeof p.url === "string" && !p.url.startsWith("blob:") && !p.url.startsWith("data:")
    )
  );
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const [galleryState, setGalleryState] = useState<MediaFormState>({});
  const [isUploadingGallery, startGalleryTransition] = useTransition();
  const [isDeletingPhoto, startDeletePhotoTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Highlights/Stats
  const [stats, setStats] = useState<StoryStat[]>(
    story?.stats && story.stats.length > 0
      ? story.stats
      : [
          { label: "Distance", value: "" },
          { label: "Highest Altitude", value: "" },
        ]
  );

  useEffect(() => {
    if (state?.ok) {
      router.push(state.next ?? "/admin/stories");
    }
  }, [state?.ok, state?.next, router]);

  // Cover handlers
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setRawCoverFile(f);
      setIsCropperOpen(true);
      setCoverState({});
    }
  };

  const handleCroppedCoverUpload = (file: File, previewUrl: string) => {
    setIsCropperOpen(false);
    if (coverInputRef.current) coverInputRef.current.value = "";

    setCurrentCoverUrl(previewUrl);
    setCoverFile(file);

    if (story?.id) {
      const fd = new FormData();
      fd.append("cover", file);
      startCoverTransition(async () => {
        try {
          const res = await uploadStoryCover(story.id, {}, fd);
          setCoverState(res);
          if (res.ok) {
            setCurrentCoverUrl(previewUrl);
          }
        } catch (err: unknown) {
          setCoverState({ error: friendlyUploadError(err, "Failed to upload cover.") });
        }
      });
    } else {
      setCoverState({});
    }
  };

  const handleReadjustCover = async () => {
    if (rawCoverFile) {
      setIsCropperOpen(true);
      return;
    }
    if (!currentCoverUrl) return;

    setIsPreparingCrop(true);
    try {
      if (currentCoverUrl.startsWith("blob:") || currentCoverUrl.startsWith("data:")) {
        const res = await fetch(currentCoverUrl);
        const blob = await res.blob();
        const f = new File([blob], "cover-readjust.jpg", { type: blob.type || "image/jpeg" });
        setRawCoverFile(f);
        setIsCropperOpen(true);
      } else {
        const res = await fetch(currentCoverUrl);
        const blob = await res.blob();
        const f = new File([blob], "cover.jpg", { type: blob.type || "image/jpeg" });
        setRawCoverFile(f);
        setIsCropperOpen(true);
      }
    } catch {
      setCoverState({ error: "Could not load image for readjusting. You can select a new photo." });
    } finally {
      setIsPreparingCrop(false);
    }
  };


  // Gallery handlers
  const handleGalleryFileSelect = async (files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => {
      const isImg =
        (f.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|webp|heic|heif|avif|gif|tiff|bmp)$/i.test(f.name)) &&
        f.type !== "image/svg+xml" &&
        !/\.svg$/i.test(f.name);
      return isImg && f.size > 0;
    });
    if (valid.length === 0) {
      setGalleryState({ error: "Please select valid image files (JPEG, PNG, WebP, HEIC, or AVIF)." });
      return;
    }
    const processed = await Promise.all(
      valid.map((f) => compressImageFile(f).catch(() => f))
    );
    setSelectedGalleryFiles((prev) => [...prev, ...processed]);
    setGalleryState({});
  };

  const removeSelectedGalleryFile = (index: number) => {
    setSelectedGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadGalleryFiles = () => {
    if (!story?.id || selectedGalleryFiles.length === 0) return;

    const fd = new FormData();
    for (const f of selectedGalleryFiles) {
      fd.append("photos", f);
    }

    startGalleryTransition(async () => {
      try {
        const res = await uploadStoryGalleryPhotos(story.id, {}, fd);
        setGalleryState(res);
        if (res.ok) {
          if (res.photos && res.photos.length > 0) {
            setExistingPhotos((prev) => [
              ...prev.filter(
                (p) => !p.url.startsWith("blob:") && !p.url.startsWith("data:")
              ),
              ...res.photos!,
            ]);
          }
          setSelectedGalleryFiles([]);
          if (galleryInputRef.current) galleryInputRef.current.value = "";
        }
      } catch (err: unknown) {
        setGalleryState({ error: friendlyUploadError(err, "Failed to upload gallery photos.") });
      }
    });
  };

  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);

  const handleDeleteExistingPhoto = (e: React.MouseEvent, photoUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!story?.id) {
      setExistingPhotos((prev) => prev.filter((p) => p.url !== photoUrl && p.thumb !== photoUrl));
      return;
    }
    if (!window.confirm("Delete this photo from the story gallery?")) return;

    setDeletingPhotoUrl(photoUrl);
    startDeletePhotoTransition(async () => {
      try {
        const res = await deleteStoryGalleryPhoto(story.id, photoUrl);
        if (res.ok) {
          setExistingPhotos((prev) => prev.filter((p) => p.url !== photoUrl && p.thumb !== photoUrl));
        } else if (res.error) {
          setGalleryState({ error: res.error });
        }
      } catch (err: unknown) {
        setGalleryState({ error: friendlyUploadError(err, "Failed to delete photo.") });
      } finally {
        setDeletingPhotoUrl(null);
      }
    });
  };

  // Metric highlights
  const addStat = () => setStats([...stats, { label: "", value: "" }]);
  const removeStat = (idx: number) => setStats(stats.filter((_, i) => i !== idx));
  const updateStat = (idx: number, field: "label" | "value", val: string) => {
    const updated = [...stats];
    updated[idx][field] = val;
    setStats(updated);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!currentCoverUrl && !coverFile) {
          setCoverState({
            error: "Cover photo is mandatory. Please upload and crop a 16:9 cover photo.",
          });
          const el = document.getElementById("cover");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
          return;
        }

        const fd = new FormData(e.currentTarget);
        fd.set("category", category);
        if (currentCoverUrl) fd.set("cover_url", currentCoverUrl);
        if (coverFile) fd.set("cover_file", coverFile);
        fd.set(
          "stats",
          JSON.stringify(stats.filter((s) => s.label.trim() && s.value.trim()))
        );
        fd.set(
          "photos",
          JSON.stringify(
            existingPhotos.filter(
              (p) => !p.url.startsWith("blob:") && !p.url.startsWith("data:")
            )
          )
        );

        // Attach queued gallery files directly
        for (const f of selectedGalleryFiles) {
          fd.append("gallery_files", f);
        }

        startTransition(() => formAction(fd));
      }}
      className="max-w-3xl space-y-8"
    >
      <div className="flex items-center justify-between">
        <Link
          href="/admin/stories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Stories</span>
        </Link>
        {story && (
          <Link
            href={`/stories/${story.slug || story.id}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <span>Live Preview</span>
            <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <fieldset disabled={isPending} className="space-y-8 border-0 m-0 p-0">
        {/* Section 01: Core Info */}
        <AdminSection
          num="01"
          title="Story details"
          hint="Title, category, subtitle, and featured rider"
          required
        >
          <div className="space-y-4">
            <Field label="Story Title" htmlFor="title" required hint="Max 200 characters">
              <Input
                id="title"
                name="title"
                required
                maxLength={200}
                defaultValue={story?.title ?? ""}
                placeholder="e.g. From Warangal to the Roof of India: Ramesh Babu Takes Moto Bharat to New Heights"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category" htmlFor="category" required>
                <CustomSelect
                  id="category"
                  name="category"
                  value={category}
                  onChange={(val) => setCategory(val as StoryCategory)}
                  options={CATEGORY_OPTIONS}
                />
              </Field>

              <Field
                label="Subtitle / Lead Hook"
                htmlFor="subtitle"
                hint="1 to 2 lines summary shown under the headline"
              >
                <Input
                  id="subtitle"
                  name="subtitle"
                  maxLength={300}
                  defaultValue={story?.subtitle ?? ""}
                  placeholder="e.g. A journey of passion, perseverance, and pride — carrying the Moto Bharat flag across Ladakh."
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <Field
                label="Featured Rider Name"
                htmlFor="rider_name"
                hint="Leave blank for club-wide achievements"
              >
                <Input
                  id="rider_name"
                  name="rider_name"
                  defaultValue={story?.rider_name ?? ""}
                  placeholder="e.g. Ramesh Babu"
                />
              </Field>

              <Field
                label="Motorcycle Model"
                htmlFor="rider_bike"
                hint="e.g. Royal Enfield Himalayan 450"
              >
                <Input
                  id="rider_bike"
                  name="rider_bike"
                  defaultValue={story?.rider_bike ?? ""}
                  placeholder="e.g. Royal Enfield Himalayan 450"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
              <Field
                label="Author Byline"
                htmlFor="author"
                hint="Default: Team Moto Bharat"
              >
                <Input
                  id="author"
                  name="author"
                  defaultValue={story?.author ?? "Team Moto Bharat"}
                  placeholder="Team Moto Bharat"
                />
              </Field>

              <Field
                label="Custom URL Slug"
                htmlFor="slug"
                hint="Optional: e.g. dev-ladakh-ride"
              >
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={story?.slug ?? ""}
                  placeholder="Auto-generated from title"
                />
              </Field>

              <Field
                label="Tags"
                htmlFor="tags"
                hint="Comma-separated keywords"
              >
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={Array.isArray(story?.tags) ? story.tags.join(", ") : ""}
                  placeholder="Ladakh Ride, Umling La, Khardung La"
                />
              </Field>
            </div>
          </div>
        </AdminSection>

        {/* Section 02: Cover Photo (Upload Style matching RideForm) */}
        <AdminSection
          num="02"
          title="Cover photo"
          hint="Direct image upload with 16:9 crop framing for social cards and masthead"
          required
        >
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 pb-1">
              <Camera className="size-4 text-accent" />
              <div>
                <p className="text-xs font-bold tracking-wider text-accent uppercase">
                  Cover Photo Upload <span className="text-danger">*</span>
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted">
                  Mandatory — the face of this story across the site (16:9 landscape format)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-4 sm:gap-6 pt-2">
              {/* Cover Preview */}
              <div className="w-full sm:w-64 space-y-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-2 shadow-md">
                  {currentCoverUrl ? (
                    <Image
                      src={currentCoverUrl}
                      alt="Story cover preview"
                      fill
                      sizes="(max-width: 640px) 100vw, 256px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1.5 p-3 text-center text-xs text-muted">
                      <Camera className="size-6 text-accent/70" />
                      <span className="font-semibold text-text">Cover photo required *</span>
                      <span className="text-[10px] text-muted">Upload and crop a 16:9 photo</span>
                    </div>
                  )}
                </div>

                {currentCoverUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleReadjustCover}
                      disabled={isPreparingCrop || isUploadingCover || isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isPreparingCrop ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Crop className="size-3.5" />
                      )}
                      <span>{isPreparingCrop ? "Loading..." : "Readjust Crop"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover || isPending || isPreparingCrop}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Camera className="size-3.5" />
                      <span>Change Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 max-w-md space-y-3">
                {isUploadingCover ? (
                  <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Uploading cover photo...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Field
                      label="Cover photo (16:9 landscape)"
                      htmlFor="cover"
                      required
                      hint={`${IMAGE_UPLOAD_HINT} · Interactive 16:9 crop dialog opens automatically`}
                    >
                      <input
                        ref={coverInputRef}
                        id="cover"
                        name="cover"
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES}
                        disabled={isPending || isUploadingCover}
                        onChange={handleCoverFileChange}
                        className="block w-full text-xs sm:text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-3 file:text-text hover:file:bg-surface-3/80 cursor-pointer disabled:opacity-50"
                      />
                    </Field>

                    {coverState.error && (
                      <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs sm:text-sm text-danger">
                        {coverState.error}
                      </p>
                    )}
                    {coverState.ok && (
                      <p className="text-xs sm:text-sm font-semibold text-success">
                        Cover photo updated successfully.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </AdminSection>

        {/* Section 03: Telemetry Metrics */}
        <AdminSection
          num="03"
          title="Telemetry metrics"
          hint="Instrument highlights strip: Distance, Highest Pass, Elapsed Time, Route, etc."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-muted">Key highlights displayed on the instrument cluster</span>
              <button
                type="button"
                onClick={addStat}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Metric</span>
              </button>
            </div>

            {stats.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={st.label}
                  onChange={(e) => updateStat(idx, "label", e.target.value)}
                  placeholder="Metric label (e.g. Distance)"
                  className="flex-1"
                />
                <Input
                  value={st.value}
                  onChange={(e) => updateStat(idx, "value", e.target.value)}
                  placeholder="Metric value (e.g. 3,400 KM)"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeStat(idx)}
                  className="p-2 text-muted hover:text-danger transition-colors cursor-pointer"
                  title="Remove metric"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </AdminSection>

        {/* Section 04: Story Narrative */}
        <AdminSection
          num="04"
          title="Story narrative"
          hint="Rich editorial article body with headings, paragraphs, and quotes"
          required
        >
          <Field
            label="Story Content"
            htmlFor="content"
            required
            hint="Paste your story text naturally. Standalone titles and headings will automatically format as article sections."
          >
            <Textarea
              id="content"
              name="content"
              rows={16}
              required
              defaultValue={story?.content ?? ""}
              placeholder="Paste or write the story narrative here..."
              className="font-sans text-xs sm:text-sm leading-relaxed"
            />
          </Field>
        </AdminSection>

        {/* Section 05: Journey Photo Gallery (Direct Image Upload matching GalleryManager) */}
        <AdminSection
          num="05"
          title="Journey photo gallery"
          hint="Upload high-resolution tour photos for the story gallery"
        >
          <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 pb-1">
              <Images className="size-4 text-accent" />
              <div>
                <p className="text-xs font-bold tracking-wider text-accent uppercase">
                  Gallery Photos Upload
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted">
                  Drag and drop multiple photos or select from your device
                </p>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleGalleryFileSelect(e.dataTransfer.files);
                }
              }}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/40 bg-surface-2/40"
              }`}
            >
              <UploadCloud className="size-8 text-accent/80 mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-text">
                Drag photos here, or click to browse
              </p>
              <p className="text-[11px] text-muted mt-1">
                JPEG, PNG, WebP up to 10 MB per image
              </p>

              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={(e) => {
                  if (e.target.files) handleGalleryFileSelect(e.target.files);
                }}
                className="absolute inset-0 size-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Selected files queued for upload */}
            {selectedGalleryFiles.length > 0 && (
              <div className="space-y-3 rounded-lg border border-border-strong/60 bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent">
                    Queued for upload ({selectedGalleryFiles.length} photos)
                  </span>
                  {story?.id && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadGalleryFiles}
                      disabled={isUploadingGallery}
                    >
                      {isUploadingGallery ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Uploading photos...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="size-3.5" />
                          <span>Upload Now</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {selectedGalleryFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video rounded-lg border border-border bg-black/40 overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeSelectedGalleryFile(idx)}
                        className="absolute top-1 right-1 rounded-full bg-black/80 p-1 text-white hover:bg-danger transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="size-3" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-black/85 px-1.5 py-0.5 text-[9px] text-white truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {galleryState.error && (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs sm:text-sm text-danger">
                {galleryState.error}
              </p>
            )}

            {/* Existing Uploaded Gallery Photos */}
            {existingPhotos.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <p className="text-xs font-bold text-text flex items-center justify-between">
                  <span>Current Gallery ({existingPhotos.length} photos)</span>
                  <span className="text-[10px] text-muted font-normal">Saved</span>
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {existingPhotos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      className="group relative aspect-video rounded-xl border border-border bg-surface-2 overflow-hidden shadow-sm"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || "Story gallery photo"}
                        fill
                        sizes="240px"
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={(e) => handleDeleteExistingPhoto(e, photo.url)}
                        disabled={isDeletingPhoto}
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/80 p-1.5 text-danger hover:bg-danger hover:text-white transition-colors cursor-pointer shadow-md disabled:opacity-50"
                        title="Delete photo from gallery"
                      >
                        {deletingPhotoUrl === photo.url ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1.5 text-[10px] text-white truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AdminSection>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto px-8">
            {isPending ? "Saving Story..." : story ? "Save Story Changes" : "Publish Story"}
          </Button>
        </div>
      </fieldset>

      <CoverCropperModal
        isOpen={isCropperOpen}
        file={rawCoverFile}
        applyLabel={story?.id ? "Save Cover Photo" : "Apply & Crop Cover"}
        onApply={handleCroppedCoverUpload}
        onCancel={() => {
          setIsCropperOpen(false);
          setRawCoverFile(null);
          if (coverInputRef.current) coverInputRef.current.value = "";
        }}
      />
    </form>
  );
}
