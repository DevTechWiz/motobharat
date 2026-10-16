"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Expand,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { normalizeImageUrl } from "@/lib/image-link";

export interface LightboxPhoto {
  url: string;
  alt?: string;
  thumb?: string;
  title?: string;
}

export interface ImageLightboxProps {
  photos: LightboxPhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function LightboxModalContent({
  photos,
  initialIndex,
  onClose,
}: {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, photos.length - 1))
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Per-photo load & fallback states
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackToThumb, setFallbackToThumb] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Lock body scroll when open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  const changePhoto = useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      setImageLoaded(false);
      setImageError(false);
      setFallbackToThumb(false);
      setAttempt(0);
      resetTransform();
    },
    [resetTransform]
  );

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    const nextIdx = (currentIndex - 1 + photos.length) % photos.length;
    changePhoto(nextIdx);
  }, [photos.length, currentIndex, changePhoto]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    const nextIdx = (currentIndex + 1) % photos.length;
    changePhoto(nextIdx);
  }, [photos.length, currentIndex, changePhoto]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const nextZ = Math.max(z - 0.5, 1);
      if (nextZ === 1) setPan({ x: 0, y: 0 });
      return nextZ;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  // Keyboard navigation & controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "+" || e.key === "=") handleZoomIn();
      else if (e.key === "-") handleZoomOut();
      else if (e.key === "r" || e.key === "R") handleRotate();
      else if (e.key === "0") resetTransform();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, handleRotate, resetTransform]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.25, 4));
    } else {
      setZoom((z) => {
        const nextZ = Math.max(z - 0.25, 1);
        if (nextZ === 1) setPan({ x: 0, y: 0 });
        return nextZ;
      });
    }
  };

  // Double click to toggle zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > 1) {
      resetTransform();
    } else {
      setZoom(2.5);
    }
  };

  // Drag / Pan handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Primary click only
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }
    if (zoom > 1) {
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const currentPhoto = photos[currentIndex] || photos[0];
  const activeSrc = fallbackToThumb && currentPhoto.thumb ? currentPhoto.thumb : currentPhoto.url;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-200"
      onWheel={handleWheel}
    >
      {/* Top action toolbar */}
      <div className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: title / photo counter */}
        <div className="flex items-center gap-3 min-w-0">
          {photos.length > 1 && (
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
              {currentIndex + 1} / {photos.length}
            </span>
          )}
          {currentPhoto.title || currentPhoto.alt ? (
            <p className="truncate text-xs sm:text-sm font-semibold text-white/90 max-w-[200px] sm:max-w-md">
              {currentPhoto.title || currentPhoto.alt}
            </p>
          ) : null}
        </div>

        {/* Center / Right: zoom & manipulation tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-white/15 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="flex size-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Zoom out (-)"
              aria-label="Zoom out"
            >
              <ZoomOut className="size-4" />
            </button>
            <span className="w-12 text-center font-mono text-[11px] font-semibold text-accent">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="flex size-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Zoom in (+)"
              aria-label="Zoom in"
            >
              <ZoomIn className="size-4" />
            </button>
          </div>

          {/* Rotate button */}
          <button
            type="button"
            onClick={handleRotate}
            className="flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            title="Rotate 90° (R)"
            aria-label="Rotate image"
          >
            <RotateCw className="size-4" />
          </button>

          {/* Reset button */}
          {(zoom > 1 || rotation !== 0 || pan.x !== 0 || pan.y !== 0) && (
            <button
              type="button"
              onClick={resetTransform}
              className="flex size-9 items-center justify-center rounded-lg border border-accent/40 bg-accent/15 text-accent transition-colors hover:bg-accent/25 cursor-pointer"
              title="Reset view (0)"
              aria-label="Reset view"
            >
              <RotateCcw className="size-4" />
            </button>
          )}

          {/* Open original link */}
          <a
            href={currentPhoto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            title="Open original image"
            aria-label="Open original image in new tab"
          >
            <ExternalLink className="size-4" />
          </a>

          <div className="mx-1 h-5 w-px bg-white/15" aria-hidden="true" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-colors hover:bg-danger hover:border-danger hover:text-white cursor-pointer"
            title="Close (Esc)"
            aria-label="Close image viewer"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main viewport canvas */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        {/* Ambient backdrop glow */}
        <div
          className="pointer-events-none absolute inset-0 bg-accent/5 blur-[120px] opacity-40"
          aria-hidden="true"
        />

        {/* Previous / Next buttons */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 z-30 flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-black hover:border-accent hover:scale-105 active:scale-95 cursor-pointer"
              title="Previous photo (Arrow Left)"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 z-30 flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-black hover:border-accent hover:scale-105 active:scale-95 cursor-pointer"
              title="Next photo (Arrow Right)"
              aria-label="Next photo"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        {/* Centered Image with dynamic transform */}
        <div
          className="relative flex items-center justify-center transition-transform duration-75 ease-out select-none will-change-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          {/* Subtle loading spinner */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center min-w-32 min-h-32">
              <Loader2 className="size-8 animate-spin text-accent" />
            </div>
          )}

          {/* Error fallback */}
          {imageError ? (
            <div className="flex max-w-sm flex-col items-center justify-center rounded-xl border border-white/15 bg-black/80 backdrop-blur-xl p-6 text-center shadow-2xl">
              <AlertCircle className="size-10 text-accent/80 mb-2" />
              <p className="text-sm font-semibold text-white">Image Preview Unavailable</p>
              <p className="mt-1 text-xs text-secondary leading-relaxed">
                The image host blocked direct display. You can retry or open the original source.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImageError(false);
                    setImageLoaded(false);
                    setAttempt((a) => a + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
                >
                  <RefreshCw className="size-3.5" /> Retry
                </button>
                <a
                  href={currentPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/30 cursor-pointer"
                >
                  <ExternalLink className="size-3.5" /> Open Photo
                </a>
              </div>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={`${activeSrc}-${attempt}`}
              src={activeSrc}
              alt={currentPhoto.alt || "Photo"}
              draggable={false}
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (!fallbackToThumb && currentPhoto.thumb && currentPhoto.thumb !== activeSrc) {
                  setFallbackToThumb(true);
                } else {
                  setImageError(true);
                }
              }}
              className={cn(
                "max-h-[75vh] sm:max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.8)] pointer-events-none transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </div>

        {/* Helpful zoom/pan hint */}
        {zoom === 1 && !imageError && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-3.5 py-1 text-[11px] font-medium text-white/60 backdrop-blur-md">
            Double-click or scroll to zoom · Click and drag to pan
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip (only if multiple photos) */}
      {photos.length > 1 && (
        <div className="relative z-20 flex h-20 shrink-0 items-center justify-center gap-2 overflow-x-auto border-t border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md">
          {photos.map((p, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={`${p.url}-${idx}`}
                type="button"
                onClick={() => changePhoto(idx)}
                className={cn(
                  "group relative aspect-4/3 h-14 shrink-0 overflow-hidden rounded-md border transition-all cursor-pointer",
                  isActive
                    ? "border-accent ring-2 ring-accent/60 scale-105"
                    : "border-white/20 opacity-50 hover:opacity-100 hover:border-white/50"
                )}
                aria-label={`Jump to photo ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumb || p.url}
                  alt={p.alt || ""}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ImageLightbox({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const isClient = useIsClient();

  if (!isClient || !isOpen || photos.length === 0) return null;

  const normalizedPhotos = photos.map((p) => ({
    ...p,
    url: normalizeImageUrl(p.url),
    thumb: p.thumb ? normalizeImageUrl(p.thumb) : undefined,
  }));

  return createPortal(
    <LightboxModalContent
      key={`${isOpen}-${initialIndex}-${normalizedPhotos.length}`}
      photos={normalizedPhotos}
      initialIndex={initialIndex}
      onClose={onClose}
    />,
    document.body
  );
}

/**
 * Convenient wrapper for single-photo click-to-zoom
 */
export function SingleImageViewer({
  src,
  alt = "Image",
  title,
  isOpen,
  onClose,
}: {
  src: string;
  alt?: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <ImageLightbox
      photos={[{ url: src, alt, title }]}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}

/**
 * Click-to-view wrapper component for any thumbnail, cover, or avatar
 */
export function ZoomableImage({
  src,
  alt = "Image",
  title,
  className,
  children,
}: {
  src?: string | null;
  alt?: string;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) {
    return <>{children}</>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "group relative block text-left cursor-pointer transition-transform active:scale-[0.99]",
          className
        )}
        title="Click to view full photo"
        aria-label={`View full photo: ${alt}`}
      >
        {children}
        <span
          className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-black/70 border border-white/20 text-white shadow-lg">
            <Expand className="size-5" />
          </span>
        </span>
      </button>

      <SingleImageViewer
        src={src}
        alt={alt}
        title={title}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
