"use client";

import { useEffect, useRef, useState } from "react";
import { IdCard, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { compressImageFile, ACCEPTED_IMAGE_TYPES, IMAGE_UPLOAD_HINT } from "@/lib/client-image";

// Card-style file picker: dotted ID-card-ratio dropzone instead of the native
// "Choose File" button. The real input stays functional (opacity-0 overlay) so
// native required-validation and keyboard focus keep working.
export function PhotoPicker({
  id,
  name,
  required = false,
  accept = ACCEPTED_IMAGE_TYPES,
  disabled = false,
  caption = "Tap to upload your DL card",
  hint = IMAGE_UPLOAD_HINT,
  existingUrl = null,
}: {
  id: string;
  name: string;
  required?: boolean;
  accept?: string;
  disabled?: boolean;
  caption?: string;
  hint?: string;
  existingUrl?: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Compress at select time so the form posts small, EXIF-free JPEGs and the
  // user never hits the 10 MB server cap. Failures keep the original file —
  // server validation then reports the specific cause.
  async function take(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    if (!f || !inputRef.current) return;
    try {
      const compressed = await compressImageFile(f);
      if (compressed !== f && inputRef.current?.files?.[0] === f) {
        const dt = new DataTransfer();
        dt.items.add(compressed);
        inputRef.current.files = dt.files;
        setFile(compressed);
      }
    } catch {
      // keep the original
    }
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    take(null);
  }

  return (
    <div
      className={cn(
        "relative flex h-28 sm:h-40 w-full flex-col items-center justify-center gap-1 sm:gap-2 overflow-hidden rounded-xl border-2 border-dashed bg-surface-2 p-2.5 sm:p-4 text-center transition-colors",
        dragging ? "border-accent bg-accent/5" : "border-border-strong hover:border-accent/60",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && "cursor-pointer",
        "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40 focus-within:outline-none"
      )}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0] ?? null;
        if (f && inputRef.current) {
          const dt = new DataTransfer();
          dt.items.add(f);
          inputRef.current.files = dt.files;
          take(f);
        }
      }}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        disabled={disabled}
        onChange={(e) => take(e.target.files?.[0] ?? null)}
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        aria-label={caption}
      />
      {preview && file ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URLs can't go through next/image */}
          <img src={preview} alt="Selected licence photo preview" className="absolute inset-0 size-full object-contain bg-bg/60" />
          <span className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-bg/85 px-3 py-2 backdrop-blur-sm">
            <span className="truncate font-mono text-[11px] text-text">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                clear();
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border-strong bg-surface px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-secondary uppercase transition-colors hover:border-danger/60 hover:text-danger"
            >
              <X className="size-3" aria-hidden /> Change
            </button>
          </span>
        </>
      ) : existingUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 URL rendered as-is in the picker frame */}
          <img src={existingUrl} alt="Licence photo on file" className="absolute inset-0 size-full object-contain bg-bg/60" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-bg/85 px-3 py-2 text-center font-mono text-[10px] tracking-wider text-muted uppercase backdrop-blur-sm">
            Stored — tap to replace
          </span>
        </>
      ) : (
        <>
          <IdCard className="size-6 sm:size-8 text-accent" aria-hidden />
          <span className="text-xs sm:text-sm font-bold text-text">{caption}</span>
          <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-muted uppercase">{hint}</span>
        </>
      )}
    </div>
  );
}
