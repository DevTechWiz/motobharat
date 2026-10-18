"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Camera } from "lucide-react";
import type { FounderPhoto } from "@/lib/founders";

interface FounderHeroGalleryProps {
  photos: FounderPhoto[];
  founderName: string;
  founderRole: string;
}

export function FounderHeroGallery({
  photos,
  founderName,
  founderRole,
}: FounderHeroGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[activeIndex] || photos[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Large Display Frame - Zero clipping: object-contain with ambient backdrop */}
      <div className="group relative h-[380px] sm:h-[500px] md:h-[580px] w-full overflow-hidden rounded-2xl border border-border bg-black/95 shadow-2xl flex items-center justify-center">
        {/* Soft ambient background fill */}
        <Image
          src={currentPhoto.url}
          alt=""
          fill
          sizes="100vw"
          aria-hidden
          className="object-cover blur-3xl opacity-25 scale-110 pointer-events-none select-none"
        />

        {/* Crisp foreground image - 100% full view, zero clipping */}
        <div className="relative size-full p-2 sm:p-4 flex items-center justify-center z-10">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.caption}
            fill
            sizes="(min-width: 1024px) 960px, 100vw"
            priority
            className="object-contain drop-shadow-2xl"
          />
        </div>

        {/* Next / Prev Controls */}
        {photos.length > 1 && (
          <div className="z-20">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 flex size-9 sm:size-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-accent hover:bg-black/90 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 flex size-9 sm:size-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-accent hover:bg-black/90 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>
          </div>
        )}
      </div>

      {/* Caption & Location Bar - Cleanly below the image, crystal clear with zero darkening on the photo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
        <div className="space-y-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-white truncate">
            {currentPhoto.caption}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="flex items-center gap-1 font-medium text-accent">
              <MapPin className="size-3.5 shrink-0" />
              <span>{currentPhoto.location}</span>
            </span>
            <span className="text-muted/60">·</span>
            <span>MotoBharat Archives · {founderName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent uppercase tracking-wider">
            {founderRole}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-secondary">
            <Camera className="size-3 text-accent" />
            <span>
              {activeIndex + 1} / {photos.length}
            </span>
          </span>
        </div>
      </div>

      {/* 5-Photo Interactive Thumbnail Strip - Full brightness & zero clipping */}
      {photos.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {photos.map((photo, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`group relative aspect-4/3 w-full overflow-hidden rounded-lg sm:rounded-xl border transition-all duration-200 focus:outline-none bg-black/80 flex items-center justify-center ${
                  isActive
                    ? "border-accent ring-2 ring-accent scale-[1.03] shadow-lg"
                    : "border-border hover:border-accent/80 hover:scale-[1.01]"
                }`}
                aria-label={`View photo ${idx + 1}: ${photo.caption}`}
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="10vw"
                  aria-hidden
                  className="object-cover blur-md opacity-20 scale-110 pointer-events-none"
                />
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  fill
                  sizes="(min-width: 640px) 20vw, 20vw"
                  className="object-contain p-1 z-10"
                />
                <span className="absolute bottom-1 right-1 z-20 rounded bg-black/85 px-1 font-mono text-[8px] sm:text-[9px] font-bold text-white/90 backdrop-blur-xs">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
