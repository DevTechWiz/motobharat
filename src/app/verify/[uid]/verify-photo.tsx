"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

// Tap-to-view for the verify-page photo: same overlay pattern as the gallery
// lightbox (Escape + backdrop close, body scroll lock). Plain <img> like
// Avatar — remote avatar hosts are not next/image-configured.
export function VerifyPhoto({ src, name }: { src?: string | null; name: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  if (!src) return <Avatar name={name} size="xl" className="mx-auto" />;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View photo of ${name}`}
        aria-haspopup="dialog"
        className="mx-auto block rounded-full transition-transform duration-200 outline-none hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.97]"
      >
        <Avatar src={src} name={name} size="xl" />
      </button>

      {open && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${name}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close photo viewer"
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- matches Avatar: remote avatar hosts aren't next/image-configured */}
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            className="animate-scale-in max-h-[80vh] w-auto max-w-full rounded-2xl border border-white/10 object-contain"
          />
        </div>
      )}
    </>
  );
}
