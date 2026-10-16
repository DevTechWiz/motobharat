"use client";

import Image from "next/image";
import { ZoomableImage } from "@/components/ui/image-lightbox";
import { ZoomIn } from "lucide-react";

export function DlViewerCard({
  imageUrl,
  riderName,
  dlNumber,
}: {
  imageUrl: string;
  riderName: string;
  dlNumber?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-surface-2 transition-all hover:border-accent/50 shadow-md">
      <ZoomableImage
        src={imageUrl}
        alt={`Driving licence of ${riderName}`}
        title={`Driving licence — ${riderName}${dlNumber ? ` (${dlNumber})` : ""}`}
        className="w-full"
      >
        <div className="relative">
          <Image
            src={imageUrl}
            alt={`Driving licence of ${riderName}`}
            width={1200}
            height={800}
            sizes="(min-width:768px) 720px, 100vw"
            className="max-h-56 sm:max-h-80 h-auto w-full object-contain bg-black/30"
          />
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md">
            <ZoomIn className="size-3.5 text-accent" />
            <span>Click to zoom & pan</span>
          </div>
        </div>
      </ZoomableImage>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 sm:px-4 py-2 bg-surface">
        <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-wider text-accent uppercase">
          Licence Document on File
        </p>
        <p className="text-[10px] sm:text-[11px] text-muted">
          Zoom in, rotate, and pan to verify typed details
        </p>
      </div>
    </div>
  );
}
