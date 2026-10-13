"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Loader2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { CoverCropperModal } from "@/components/admin/cover-cropper-modal";
import { uploadRideCover, removeRideCover, type MediaFormState } from "../../../actions";

export function CoverUpload({
  rideId,
  coverUrl,
}: {
  rideId: string;
  coverUrl: string | null;
}) {
  const [state, setState] = useState<MediaFormState>({});
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setRawFile(f);
      setIsCropperOpen(true);
    }
  };

  const handleCroppedUpload = (file: File) => {
    setIsCropperOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const fd = new FormData();
    fd.append("cover", file);

    startTransition(async () => {
      const res = await uploadRideCover(rideId, {}, fd);
      setState(res);
      setRawFile(null);
    });
  };

  const handleRemoveCurrentCover = () => {
    if (!window.confirm("Remove this ride's cover photo?")) return;
    startRemoveTransition(async () => {
      const res = await removeRideCover(rideId);
      setState(res);
    });
  };

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">Cover Photo</h3>

      <div className="flex flex-wrap items-start gap-4 sm:gap-6">
        {/* Current cover display */}
        <div className="w-full sm:w-56 space-y-2">
          <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl border border-border bg-surface-2">
            {coverUrl ? (
              <Image src={coverUrl} alt="Current ride cover" fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover" />
            ) : (
              <p className="flex size-full items-center justify-center text-xs text-muted">No cover</p>
            )}
          </div>
          {coverUrl && (
            <button
              type="button"
              onClick={handleRemoveCurrentCover}
              disabled={isRemoving || isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger-hover disabled:opacity-50 transition-colors"
            >
              <Trash2 className="size-3.5" />
              {isRemoving ? "Removing..." : "Remove Cover"}
            </button>
          )}
        </div>

        {/* Upload form */}
        <div className="flex-1 max-w-md space-y-4">
          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.ok && <p className="text-sm text-success">Cover updated.</p>}

          {isPending ? (
            <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
              <Loader2 className="size-4 animate-spin" />
              Uploading cover photo...
            </div>
          ) : (
            <form className="space-y-3">
              <Field
                label="Upload new cover photo"
                htmlFor="cover"
                hint="JPEG, WebP or PNG, max 10 MB · Adjust and fit in 16:10 directly before upload"
              >
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    id="cover"
                    name="cover"
                    type="file"
                    accept="image/jpeg,image/webp,image/png"
                    disabled={isPending}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-3 file:text-text hover:file:bg-surface-3/80 cursor-pointer disabled:opacity-50"
                  />
                </div>
              </Field>
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
