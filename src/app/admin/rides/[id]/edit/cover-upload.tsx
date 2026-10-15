"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Loader2, Crop } from "lucide-react";
import { Field } from "@/components/ui/field";
import { CoverCropperModal } from "@/components/admin/cover-cropper-modal";
import { uploadRideCover, removeRideCover, fetchRemoteImageDataUrl, type MediaFormState } from "../../../actions";
import { friendlyUploadError } from "@/lib/client-image";

export function CoverUpload({
  rideId,
  coverUrl,
}: {
  rideId: string | null;
  coverUrl: string | null;
}) {
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(coverUrl);
  const [state, setState] = useState<MediaFormState>({});
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevCoverUrl, setPrevCoverUrl] = useState(coverUrl);
  if (coverUrl !== prevCoverUrl) {
    setPrevCoverUrl(coverUrl);
    setCurrentCoverUrl(coverUrl);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setRawFile(f);
      setIsCropperOpen(true);
      setState({});
    }
  };

  const handleCroppedUpload = (file: File) => {
    setIsCropperOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!rideId) {
      setState({ error: "Please save ride details in Section 01 first before uploading cover photo." });
      return;
    }

    const preview = URL.createObjectURL(file);
    const fd = new FormData();
    fd.append("cover", file);

    startTransition(async () => {
      try {
        const res = await uploadRideCover(rideId, {}, fd);
        setState(res);
        if (res.ok) {
          setCurrentCoverUrl(preview);
        }
      } catch (err: unknown) {
        setState({ error: friendlyUploadError(err, "Failed to upload cover.") });
      }
    });
  };

  const [isPreparingCrop, setIsPreparingCrop] = useState(false);

function dataUrlToFile(dataUrl: string, filename = "cover-readjust.jpg"): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const u8arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    u8arr[i] = binary.charCodeAt(i);
  }
  return new File([u8arr], filename, { type: mime });
}

  const handleReadjustCover = async () => {
    if (rawFile) {
      setIsCropperOpen(true);
      return;
    }
    if (!currentCoverUrl) return;

    setIsPreparingCrop(true);
    try {
      if (currentCoverUrl.startsWith("blob:")) {
        const res = await fetch(currentCoverUrl);
        const blob = await res.blob();
        const f = new File([blob], "cover-readjust.jpg", { type: blob.type || "image/jpeg" });
        setRawFile(f);
        setIsCropperOpen(true);
      } else if (currentCoverUrl.startsWith("data:")) {
        const f = dataUrlToFile(currentCoverUrl);
        setRawFile(f);
        setIsCropperOpen(true);
      } else {
        const { dataUrl, error } = await fetchRemoteImageDataUrl(currentCoverUrl);
        if (dataUrl) {
          const f = dataUrlToFile(dataUrl);
          setRawFile(f);
          setIsCropperOpen(true);
        } else {
          setState({ error: error || "Could not load image for readjusting. You can upload a new photo." });
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load image for readjusting.";
      setState({ error: message });
    } finally {
      setIsPreparingCrop(false);
    }
  };

  const handleRemoveCurrentCover = () => {
    if (!rideId) return;
    if (!window.confirm("Remove this ride's cover photo?")) return;
    startRemoveTransition(async () => {
      try {
        const res = await removeRideCover(rideId);
        setState(res);
        if (res.ok) {
          setCurrentCoverUrl(null);
          setRawFile(null);
        }
      } catch (err: unknown) {
        setState({ error: friendlyUploadError(err, "Failed to remove cover.") });
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start gap-4 sm:gap-6">
        {/* Current cover display */}
        <div className="w-full sm:w-56 space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-2">
            {currentCoverUrl ? (
              <Image src={currentCoverUrl} alt="Current ride cover" fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover" />
            ) : (
              <p className="flex size-full items-center justify-center text-xs text-muted">No cover</p>
            )}
          </div>
          {currentCoverUrl && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleReadjustCover}
                disabled={isPreparingCrop || isRemoving || isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover disabled:opacity-50 transition-colors"
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
                onClick={handleRemoveCurrentCover}
                disabled={isRemoving || isPending || isPreparingCrop}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger-hover disabled:opacity-50 transition-colors"
              >
                <Trash2 className="size-3.5" />
                <span>{isRemoving ? "Removing..." : "Remove Cover"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Upload form */}
        <div className="flex-1 max-w-md space-y-4">
          {isPending ? (
            <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
              <Loader2 className="size-4 animate-spin" />
              Uploading cover photo...
            </div>
          ) : (
            <form className="space-y-3">
              <Field
                label="Cover photo"
                htmlFor="cover"
                required
                hint="JPEG or WebP, max 10 MB · Adjust and fit in 16:9 directly before upload"
              >
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    id="cover"
                    name="cover"
                    type="file"
                    accept="image/jpeg,image/webp"
                    disabled={isPending}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-3 file:text-text hover:file:bg-surface-3/80 cursor-pointer disabled:opacity-50"
                  />
                </div>
              </Field>

              {/* Status alerts below input */}
              {state.error && (
                <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {state.error}
                </p>
              )}
              {state.ok && <p className="text-sm font-semibold text-success">Cover updated successfully.</p>}
            </form>
          )}
        </div>
      </div>

      {/* Interactive modal for zooming and dragging to fit 16:10 */}
      <CoverCropperModal
        isOpen={isCropperOpen}
        file={rawFile}
        applyLabel="Upload Cover"
        onApply={handleCroppedUpload}
        onCancel={() => {
          setIsCropperOpen(false);
          setRawFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
    </section>
  );
}
