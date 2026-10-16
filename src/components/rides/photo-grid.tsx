"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";

export interface GalleryPhoto {
  url: string;
  thumb: string;
  alt: string;
}

function PhotoThumb({ photo }: { photo: GalleryPhoto }) {
  const [failed, setFailed] = useState(false);
  const [src, setSrc] = useState(photo.thumb || photo.url);

  if (failed) {
    return (
      <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-surface-2 to-surface-3 p-3 text-center">
        <Camera className="size-6 text-accent/60 mb-1" aria-hidden />
        <span className="text-[10px] font-mono text-muted line-clamp-1">{photo.alt}</span>
      </div>
    );
  }

  const isLocalOrData =
    typeof src === "string" && (src.startsWith("blob:") || src.startsWith("data:"));

  return (
    <Image
      src={src}
      alt={photo.alt}
      fill
      unoptimized={isLocalOrData}
      sizes="(min-width:768px) 25vw, 50vw"
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      onError={() => {
        if (src !== photo.url && photo.url) {
          setSrc(photo.url);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export function PhotoGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {photos.map((p, i) => (
          <button
            key={p.url}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-surface-2 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_16px_40px_-16px_rgba(245,158,11,0.4)] active:scale-[0.97] cursor-pointer"
            aria-label={`View photo: ${p.alt}`}
          >
            <PhotoThumb photo={p} />
            <span
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              aria-hidden
            />
          </button>
        ))}
      </div>

      <ImageLightbox
        photos={photos}
        initialIndex={index ?? 0}
        isOpen={index !== null}
        onClose={() => setIndex(null)}
      />
    </>
  );
}

