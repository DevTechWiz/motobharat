"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Images,
  UploadCloud,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMedia, uploadGalleryPhotos } from "../../../actions";
import {
  compressImageFile,
  friendlyUploadError,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_EXTENSIONS,
  IMAGE_UPLOAD_HINT,
} from "@/lib/client-image";
import { ImageLightbox } from "@/components/ui/image-lightbox";

function DeletePhotoButton({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted: () => void;
}) {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this photo from the gallery?")) return;
    startTransition(async () => {
      try {
        const res = await deleteMedia(id);
        if (res && "error" in res && res.error) {
          alert(res.error);
        } else {
          onDeleted();
        }
      } catch (err: unknown) {
        alert(friendlyUploadError(err, "Failed to delete photo."));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label="Delete photo"
      className="rounded-md bg-black/75 p-1.5 text-danger backdrop-blur-sm transition-all hover:bg-danger hover:text-white disabled:opacity-50 cursor-pointer shadow-md"
    >
      {isDeleting ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Trash2 className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

export function GalleryManager({
  rideId,
  photos,
}: {
  rideId: string | null;
  photos: { id: string; url: string; alt: string }[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const currentPhotos = photos.filter((p) => !deletedIds.includes(p.id));

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<{ current: number; total: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleDeletePhoto = (photoId: string) => {
    setDeletedIds((prev) => [...prev, photoId]);
    router.refresh();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      const isImg =
        (f.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|webp|heic|heif|avif|gif|tiff|bmp)$/i.test(f.name)) &&
        f.type !== "image/svg+xml" &&
        !/\.svg$/i.test(f.name);
      return isImg && f.size > 0;
    });
    if (valid.length === 0) {
      setStatus({ type: "error", text: "Please select valid image files (JPEG, PNG, WebP, HEIC, or AVIF)." });
      return;
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
    setStatus(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setUploadProgress(null);
    setCurrentStep(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUploadAll = async () => {
    setStatus(null);

    if (!rideId) {
      setStatus({
        type: "error",
        text: "Please save ride details in Section 01 first before adding photos.",
      });
      return;
    }

    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    let uploaded = 0;
    const errors: string[] = [];
    const successfulIndices = new Set<number>();

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const original = selectedFiles[i];
        const isHeic =
          /\.(heic|heif)$/i.test(original.name) ||
          original.type === "image/heic" ||
          original.type === "image/heif";

        setCurrentStep({ current: i + 1, total: selectedFiles.length });
        if (isHeic) {
          setUploadProgress(
            `Converting iPhone photo ${i + 1} of ${selectedFiles.length}...`
          );
        } else {
          setUploadProgress(
            `Optimizing photo ${i + 1} of ${selectedFiles.length}...`
          );
        }

        let file = original;
        try {
          file = await compressImageFile(original);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Processing failed.";
          errors.push(msg);
          continue;
        }

        setUploadProgress(
          `Uploading photo ${i + 1} of ${selectedFiles.length}...`
        );

        const fd = new FormData();
        fd.append("photos", file);
        fd.set("alt", "Ride photo");

        try {
          const res = await uploadGalleryPhotos(rideId, {}, fd);
          if (res.error) {
            errors.push(`${original.name}: ${res.error}`);
          } else {
            uploaded++;
            successfulIndices.add(i);
          }
        } catch (err: unknown) {
          errors.push(`${original.name}: ${friendlyUploadError(err, "Upload failed.")}`);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setCurrentStep(null);
    }

    if (successfulIndices.size > 0) {
      setSelectedFiles((prev) =>
        prev.filter((_, idx) => !successfulIndices.has(idx))
      );
      router.refresh();
    }

    if (errors.length > 0) {
      if (uploaded > 0) {
        setStatus({
          type: "error",
          text: `Uploaded ${uploaded} photo${uploaded === 1 ? "" : "s"}. ${errors.length} failed: ${errors.join("; ")}`,
        });
      } else {
        setStatus({ type: "error", text: errors.join("; ") });
      }
    } else if (uploaded > 0) {
      setStatus({
        type: "success",
        text: `Successfully uploaded ${uploaded} ${
          uploaded === 1 ? "photo" : "photos"
        }.`,
      });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="size-4 text-accent" />
          <div>
            <p className="text-xs font-bold tracking-wider text-accent uppercase">
              Ride Gallery
            </p>
            <p className="text-[11px] text-muted">
              Photos displayed in the ride gallery
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-secondary">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Zone (Drag & Drop or Click) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200 text-center ${
          isDragging
            ? "border-accent bg-accent/10 scale-[1.01]"
            : "border-border hover:border-accent/60 bg-surface-2/60 hover:bg-surface-2"
        }`}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="size-6" />
        </div>
        <p className="text-sm font-semibold text-white">
          Drop ride photos here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted max-w-sm leading-relaxed">
          {IMAGE_UPLOAD_HINT}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            Select Photos ({ACCEPTED_IMAGE_EXTENSIONS})
          </Button>
        </div>
      </div>

      {/* Pending Files Tray */}
      {selectedFiles.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
              <FileImage className="size-4" />
              Ready to upload: {selectedFiles.length}{" "}
              {selectedFiles.length === 1 ? "photo" : "photos"}
            </span>
            <button
              type="button"
              onClick={clearSelectedFiles}
              disabled={isUploading}
              className="text-[11px] text-muted hover:text-danger transition-colors cursor-pointer disabled:opacity-50"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-surface px-2.5 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-white font-medium max-w-[220px] sm:max-w-xs">
                    {file.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted shrink-0">
                    ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={isUploading}
                  className="text-muted hover:text-danger p-0.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove file"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Active upload progress banner */}
          {isUploading && (
            <div className="flex items-center gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-xs text-accent">
              <Loader2 className="size-4 animate-spin shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white truncate">
                  {uploadProgress || "Uploading..."}
                </p>
                {currentStep && (
                  <p className="text-[10px] text-accent/80">
                    Photo {currentStep.current} of {currentStep.total}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isUploading}
              onClick={handleUploadAll}
              className="w-full justify-center font-bold cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>{uploadProgress || "Uploading..."}</span>
                </>
              ) : (
                `Upload ${selectedFiles.length} ${
                  selectedFiles.length === 1 ? "Photo" : "Photos"
                }`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status?.type === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-xs text-danger">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{status.text}</span>
        </div>
      )}
      {status?.type === "success" && (
        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{status.text}</span>
        </div>
      )}

      {/* Existing Photos Grid */}
      {currentPhotos.length === 0 ? (
        <p className="text-xs text-muted italic pt-1">
          No photos in gallery yet. Upload photos above to add them to this ride.
        </p>
      ) : (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-secondary font-medium">
            <span>Uploaded Gallery Photos ({currentPhotos.length})</span>
            <span className="text-[11px] text-muted">Click photo to preview</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {currentPhotos.map((p, idx) => (
              <div
                key={p.id}
                className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-surface-2 transition-transform hover:scale-[1.02]"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="size-full text-left cursor-pointer"
                  title="Click to view full photo"
                >
                  <Image
                    src={p.url}
                    alt={p.alt || "Ride photo"}
                    fill
                    sizes="(min-width:1024px) 16vw, (min-width:640px) 25vw, 50vw"
                    className="object-cover"
                  />
                </button>
                <div className="absolute top-1.5 right-1.5 opacity-90 transition-opacity group-hover:opacity-100 z-10">
                  <DeletePhotoButton id={p.id} onDeleted={() => handleDeletePhoto(p.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox for previewing existing gallery photos */}
      <ImageLightbox
        photos={currentPhotos.map((p) => ({ url: p.url, alt: p.alt }))}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
