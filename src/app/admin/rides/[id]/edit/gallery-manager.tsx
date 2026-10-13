"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Images, FolderOpen, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  deleteMedia,
  addGalleryPhotoByUrl,
  uploadGalleryPhotos,
} from "../../../actions";

function DeletePhotoButton({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted: () => void;
}) {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteMedia(id);
      if (res && "error" in res && res.error) {
        alert(res.error);
      } else {
        onDeleted();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label="Delete photo"
      className="rounded-md bg-bg/85 p-1.5 text-danger shadow-sm backdrop-blur-xs transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
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
  rideId: string;
  photos: { id: string; url: string; alt: string }[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setUrlInput("");
      setStatus(null);
    }
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    setStatus(null);

    // Option 1: File upload (sequential upload to stay well under request body limits)
    if (selectedFiles.length > 0) {
      startTransition(async () => {
        let uploaded = 0;
        const errors: string[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgress(
            selectedFiles.length > 1
              ? `Uploading ${i + 1} of ${selectedFiles.length}...`
              : "Uploading..."
          );

          const fd = new FormData();
          fd.append("photos", file);
          fd.set("alt", "Ride photo");

          const res = await uploadGalleryPhotos(rideId, {}, fd);
          if (res.error) {
            errors.push(`${file.name}: ${res.error}`);
          } else {
            uploaded++;
          }
        }

        setUploadProgress(null);

        if (errors.length > 0) {
          if (uploaded > 0) {
            setStatus({
              type: "error",
              text: `Uploaded ${uploaded} photo(s). ${errors.length} failed: ${errors.join("; ")}`,
            });
          } else {
            setStatus({ type: "error", text: errors[0] });
          }
        } else {
          setStatus({
            type: "success",
            text: `Successfully uploaded ${uploaded} ${
              uploaded === 1 ? "photo" : "photos"
            }.`,
          });
          clearSelectedFiles();
        }
        router.refresh();
      });
      return;
    }

    // Option 2: Image URL (Google Drive, direct link, etc.)
    const trimmedUrl = urlInput.trim();
    if (trimmedUrl) {
      startTransition(async () => {
        const fd = new FormData();
        fd.set("url", trimmedUrl);
        fd.set("alt", "Ride photo");

        const res = await addGalleryPhotoByUrl(rideId, {}, fd);
        if (res.error) {
          setStatus({ type: "error", text: res.error });
        } else {
          setStatus({
            type: "success",
            text: "Photo added from link successfully.",
          });
          setUrlInput("");
          router.refresh();
        }
      });
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-3 sm:p-4 max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="size-4 text-accent" />
          <div>
            <p className="text-xs font-bold tracking-wider text-accent uppercase">
              Ride Gallery
            </p>
            <p className="text-[11px] text-muted">
              Add multiple ride photos via file upload or paste web / Google Drive links
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-secondary">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      {/* Status alerts */}
      {status?.type === "error" && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {status.text}
        </div>
      )}
      {status?.type === "success" && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
          {status.text}
        </div>
      )}

      {/* Windows FileOpen-style Unified Field */}
      <div className="rounded-lg border border-border bg-surface-2 p-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Hidden multi-file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/webp,image/png"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Browse button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 gap-1.5"
          >
            <FolderOpen className="size-3.5 text-accent" />
            <span>Browse...</span>
          </Button>

          {/* Center input field: shows selected files or URL text input */}
          <div className="relative flex-1 min-w-0">
            {selectedFiles.length > 0 ? (
              <div className="flex h-9 w-full items-center justify-between rounded-md border border-accent/40 bg-accent/10 px-3 text-xs text-accent">
                <span className="truncate font-medium">
                  📁 {selectedFiles.length}{" "}
                  {selectedFiles.length === 1 ? "photo" : "photos"} selected (
                  {selectedFiles.map((f) => f.name).slice(0, 2).join(", ")}
                  {selectedFiles.length > 2 ? "..." : ""})
                </span>
                <button
                  type="button"
                  onClick={clearSelectedFiles}
                  className="ml-2 text-muted hover:text-danger transition-colors"
                  aria-label="Clear selected files"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <Input
                type="url"
                value={urlInput}
                disabled={isPending}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (status) setStatus(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Paste image URL (https://... or Google Drive) or click Browse..."
                className="text-xs h-9 bg-bg/60"
              />
            )}
          </div>

          {/* Action button */}
          <Button
            type="button"
            size="sm"
            disabled={
              isPending ||
              (selectedFiles.length === 0 && !urlInput.trim())
            }
            onClick={handleSubmit}
            className="shrink-0 font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>{uploadProgress || "Processing..."}</span>
              </>
            ) : selectedFiles.length > 0 ? (
              `Upload ${
                selectedFiles.length > 1 ? `(${selectedFiles.length})` : ""
              }`
            ) : (
              "Add Photo"
            )}
          </Button>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <p className="text-xs text-muted italic pt-1">
          No photos in gallery yet. Click Browse to select photos from your device, or paste a link above.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 lg:grid-cols-6 pt-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-surface-2"
            >
              <Image
                src={p.url}
                alt={p.alt || "Ride photo"}
                fill
                sizes="(min-width:1024px) 16vw, (min-width:640px) 25vw, 50vw"
                className="object-cover"
              />
              <div className="absolute top-1.5 right-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                <DeletePhotoButton id={p.id} onDeleted={() => router.refresh()} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
