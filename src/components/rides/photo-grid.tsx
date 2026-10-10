"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryPhoto {
  url: string;
  thumb: string;
  alt: string;
}

export function PhotoGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {photos.map((p, i) => (
          <button
            key={p.url}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-surface-2"
            aria-label={`View photo: ${p.alt}`}
          >
            <Image
              src={p.thumb}
              alt={p.alt}
              fill
              sizes="(min-width:768px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open && index !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" aria-hidden />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous photo"
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next photo"
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}

          <figure className="max-h-full max-w-4xl space-y-3">
            <Image
              src={photos[index].url}
              alt={photos[index].alt}
              width={1600}
              height={1067}
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
              priority
            />
            <figcaption className="flex items-center justify-between gap-4 text-xs text-white/80">
              <span>{photos[index].alt}</span>
              <span className="font-mono tabular-nums">
                {index + 1} / {photos.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
