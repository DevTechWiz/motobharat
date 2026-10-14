"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoverCropperModalProps {
  isOpen: boolean;
  file: File | null;
  applyLabel?: string;
  onApply: (croppedFile: File, previewUrl: string) => void;
  onCancel: () => void;
}

export function CoverCropperModal({
  isOpen,
  file,
  applyLabel = "Apply & Fit Cover",
  onApply,
  onCancel,
}: CoverCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 480, height: 300 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image object URL whenever file changes
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImageSrc(url);
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);


  // Track container dimensions on resize
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isOpen]);

  if (!isOpen || !file || !imageSrc) return null;

  // Calculate layout scaling
  const imgW = naturalSize?.width ?? 1;
  const imgH = naturalSize?.height ?? 1;
  const cW = containerSize.width || 480;
  const cH = containerSize.height || 300;

  // Base scale to cover the 16:9 container
  const baseScale = Math.max(cW / imgW, cH / imgH);
  const currentScale = baseScale * zoom;
  const displayedW = imgW * currentScale;
  const displayedH = imgH * currentScale;

  const maxPanX = Math.max(0, (displayedW - cW) / 2);
  const maxPanY = Math.max(0, (displayedH - cH) / 2);

  const clampPan = (x: number, y: number) => ({
    x: Math.max(-maxPanX, Math.min(maxPanX, x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, y)),
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan(clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const nextZoom = Math.max(1, Math.min(3, Number((zoom + delta).toFixed(2))));
    setZoom(nextZoom);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleApply = () => {
    if (!naturalSize) return;

    // Output target resolution: 1920x1080 (16:9)
    const outW = 1920;
    const outH = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map displayed viewport back to natural image coordinates
    // Center of natural image is (imgW / 2, imgH / 2)
    // Visible viewport in natural pixels:
    const viewportInNaturalW = cW / currentScale;
    const viewportInNaturalH = cH / currentScale;

    // Pan offset in natural pixels:
    const panInNaturalX = pan.x / currentScale;
    const panInNaturalY = pan.y / currentScale;

    const cropX = imgW / 2 - viewportInNaturalW / 2 - panInNaturalX;
    const cropY = imgH / 2 - viewportInNaturalH / 2 - panInNaturalY;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      ctx.drawImage(
        img,
        Math.max(0, cropX),
        Math.max(0, cropY),
        Math.min(imgW, viewportInNaturalW),
        Math.min(imgH, viewportInNaturalH),
        0,
        0,
        outW,
        outH,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const cleanName = file.name.replace(/\.[^.]+$/, "") + "_cover.jpg";
          const croppedFile = new File([blob], cleanName, { type: "image/jpeg" });
          const previewUrl = URL.createObjectURL(croppedFile);
          onApply(croppedFile, previewUrl);
        },
        "image/jpeg",
        0.9,
      );
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-surface-1 p-5 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cropper-title"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 id="cropper-title" className="text-base font-bold text-text">
              Adjust Cover Photo
            </h3>
            <p className="text-xs text-muted">
              Drag to reposition · Zoom to frame for the 16:9 cover banner
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Viewport Frame (16:9) */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative aspect-video w-full select-none overflow-hidden rounded-xl border-2 border-accent/40 bg-black cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Draggable image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Cover preview"
            draggable={false}
            style={{
              width: `${displayedW}px`,
              height: `${displayedH}px`,
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center select-none"
          />

          {/* Rule of thirds grid overlay */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/10">
            <div className="border-r border-b border-white/10" />
            <div className="border-r border-b border-white/10" />
            <div className="border-b border-white/10" />
            <div className="border-r border-b border-white/10" />
            <div className="border-r border-b border-white/10" />
            <div className="border-b border-white/10" />
            <div className="border-r border-white/10" />
            <div className="border-r border-white/10" />
            <div />
          </div>

          {/* Interactive hint badge */}
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
            <Move className="size-3" />
            Drag to move
          </div>
        </div>

        {/* Controls: Zoom & Reset */}
        <div className="flex items-center gap-3 bg-surface-2 p-3 rounded-xl border border-border">
          <ZoomOut className="size-4 text-muted shrink-0" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-accent cursor-pointer"
            aria-label="Zoom level"
          />
          <ZoomIn className="size-4 text-muted shrink-0" />
          <span className="w-12 text-right font-mono text-xs text-muted">
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent font-medium ml-2 transition-colors"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            <Check className="size-4" />
            {applyLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
