"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, ZoomIn, ArrowUpRight } from "lucide-react";
import { ImageLightbox, type LightboxPhoto } from "@/components/ui/image-lightbox";
import { formatRideDate } from "@/lib/format";

export interface MemoryItem {
  id: string;
  url: string;
  thumb_url?: string | null;
  alt?: string | null;
  created_at: string;
  event?: {
    id: string;
    title: string;
    slug?: string | null;
    starts_at: string;
    destination?: string | null;
  } | null;
}

export function MemoriesGrid({
  memories,
  columns = "4",
}: {
  memories: MemoryItem[];
  columns?: "3" | "4";
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!memories || memories.length === 0) return null;

  const lightboxPhotos: LightboxPhoto[] = memories.map((m) => ({
    url: m.url,
    thumb: m.thumb_url || m.url,
    title: m.event?.title || m.alt || "Community Memory",
    alt: m.alt || m.event?.title || "MotoBharat Ride Photo",
  }));

  const gridClass =
    columns === "3"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6";

  return (
    <>
      <div className={gridClass}>
        {memories.map((m, idx) => {
          const rideHref = m.event
            ? `/rides/${m.event.slug || m.event.id}`
            : null;
          const displayTitle = m.event?.title || "Community Expedition";
          const displayLocation = m.event?.destination || "Warangal Column";
          const displayDate = m.event?.starts_at
            ? formatRideDate(m.event.starts_at)
            : formatRideDate(m.created_at);

          return (
            <div
              key={m.id || idx}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface-2 hover:shadow-[0_16px_40px_-16px_rgba(245,158,11,0.3)]"
            >
              {/* Photo Area with Lightbox Click */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setLightboxIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightboxIndex(idx);
                  }
                }}
                className="relative aspect-16/10 w-full cursor-pointer overflow-hidden bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label={`View full photo: ${displayTitle}`}
              >
                <Image
                  src={m.thumb_url || m.url}
                  alt={m.alt || displayTitle}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-40 transition-opacity duration-300 group-hover:opacity-60" />

                {/* Top-right quick zoom chip */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md opacity-80 transition-all duration-200 group-hover:opacity-100 group-hover:scale-105">
                  <ZoomIn className="size-3 text-accent" aria-hidden />
                  <span className="hidden sm:inline">Zoom</span>
                </div>

                {/* Bottom pill badge on image: Location */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md">
                  <MapPin className="size-3 text-accent shrink-0" aria-hidden />
                  <span className="truncate max-w-[12rem]">{displayLocation}</span>
                </div>
              </div>

              {/* Bottom Card Content */}
              <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-muted uppercase">
                      <Calendar className="size-3 text-accent/80 shrink-0" aria-hidden />
                      <span>{displayDate}</span>
                    </span>
                    {rideHref && (
                      <Link
                        href={rideHref}
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold tracking-wider text-accent uppercase transition-colors hover:text-white"
                        aria-label={`View ride: ${displayTitle}`}
                      >
                        <span>Ride</span>
                        <ArrowUpRight className="size-3" aria-hidden />
                      </Link>
                    )}
                  </div>

                  {rideHref ? (
                    <Link
                      href={rideHref}
                      className="block text-sm sm:text-base font-bold text-white transition-colors duration-150 hover:text-accent line-clamp-1"
                    >
                      {displayTitle}
                    </Link>
                  ) : (
                    <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                      {displayTitle}
                    </h4>
                  )}
                </div>

                {m.alt && m.alt !== "Ride photo" && m.alt !== displayTitle && (
                  <p className="mt-2 text-[11px] sm:text-xs text-secondary line-clamp-2">
                    {m.alt}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
