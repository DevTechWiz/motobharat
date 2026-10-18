"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Maximize2, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

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
  const [mode, setMode] = useState<"fit" | "fill">("fit");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 480, height: 300 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  const onApplyRef = useRef(onApply);
  useEffect(() => {
    onApplyRef.current = onApply;
  }, [onApply]);

  // Load image object URL whenever file changes
  useEffect(() => {
    if (!file) return;
    let isCancelled = false;
    let activeUrl = "";

    (async () => {
      let sourceFile = file;
      const isHeic =
        /\.(heic|heif)$/i.test(file.name) ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      if (isHeic && typeof window !== "undefined") {
        try {
          type HeicConverter = (options: {
            blob: Blob;
            toType?: string;
            quality?: number;
          }) => Promise<Blob | Blob[]>;
          const raw = (await import("heic2any")) as unknown;
          const mod = raw as { default?: HeicConverter | { default?: HeicConverter } };
          const heic2any =
            typeof mod.default === "function"
              ? mod.default
              : typeof raw === "function"
              ? (raw as HeicConverter)
              : typeof mod.default?.default === "function"
              ? mod.default.default
              : null;
          if (heic2any) {
            const conversionPromise = heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.75,
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 25000)
            );
            const result = await Promise.race([conversionPromise, timeoutPromise]);
            const convertedBlob = Array.isArray(result) ? result[0] : result;
            if (convertedBlob && !isCancelled) {
              sourceFile = new File(
                [convertedBlob],
                file.name.replace(/\.(heic|heif)$/i, ".jpg"),
                { type: "image/jpeg" }
              );
            }
          }
        } catch (e) {
          console.warn("[CoverCropperModal] heic2any conversion failed:", e);
        }
      }

      if (isCancelled) return;
      activeUrl = URL.createObjectURL(sourceFile);
      const img = new Image();
      img.src = activeUrl;
      img.onload = () => {
        if (isCancelled) return;
        setImageSrc(activeUrl);
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      img.onerror = () => {
        if (isCancelled) return;
        // If browser cannot render this image format in canvas, bypass cropper and pass through directly
        onApplyRef.current(sourceFile, activeUrl);
      };
    })();

    return () => {
      isCancelled = true;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
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

  // Fit mode preserves 100% of the image without any cut; Fill mode crops to fill 16:9
  const baseScale = mode === "fit" ? Math.min(cW / imgW, cH / imgH) : Math.max(cW / imgW, cH / imgH);
  const currentScale = baseScale * zoom;
  const displayedW = imgW * currentScale;
  const displayedH = imgH * currentScale;

  const maxPanX = Math.max(0, Math.abs(displayedW - cW) / 2);
  const maxPanY = Math.max(0, Math.abs(displayedH - cH) / 2);

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
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const nextZoom = Math.max(0.6, Math.min(3, Number((zoom + delta).toFixed(2))));
    setZoom(nextZoom);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleApply = () => {
    if (!naturalSize || !imageSrc) return;

    // Use full natural resolution (up to 4K / 3840px) — never arbitrarily downscaling high-res images
    const naturalMaxEdge = Math.max(imgW, imgH);
    const outW = Math.max(1920, Math.min(naturalMaxEdge, 3840));
    const outH = Math.round((outW * 9) / 16);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      if (mode === "fit") {
        // 1. Draw ambient blurred background to fill 16:9 canvas cleanly without cutting
        ctx.save();
        ctx.filter = "blur(40px)";
        const bgScale = Math.max(outW / imgW, outH / imgH);
        const bgW = imgW * bgScale;
        const bgH = imgH * bgScale;
        ctx.drawImage(img, (outW - bgW) / 2, (outH - bgH) / 2, bgW, bgH);
        ctx.restore();

        // 2. Dark vignette overlay on backdrop for contrast
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, outW, outH);

        // 3. Draw 100% full original photo contained with zero pixels cropped
        const fitScale = Math.min(outW / imgW, outH / imgH) * zoom;
        const drawW = imgW * fitScale;
        const drawH = imgH * fitScale;
        const panXInCanvas = (pan.x / cW) * outW;
        const panYInCanvas = (pan.y / cH) * outH;
        const drawX = (outW - drawW) / 2 + panXInCanvas;
        const drawY = (outH - drawH) / 2 + panYInCanvas;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } else {
        // Fill / crop mode
        const viewportInNaturalW = cW / currentScale;
        const viewportInNaturalH = cH / currentScale;
        const panInNaturalX = pan.x / currentScale;
        const panInNaturalY = pan.y / currentScale;

        const cropX = imgW / 2 - viewportInNaturalW / 2 - panInNaturalX;
        const cropY = imgH / 2 - viewportInNaturalH / 2 - panInNaturalY;

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
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const isWebp = blob.type === "image/webp";
          const ext = isWebp ? ".webp" : ".jpg";
          const mime = isWebp ? "image/webp" : "image/jpeg";
          const cleanName = file.name.replace(/\.[^.]+$/, "") + `_cover${ext}`;
          const croppedFile = new File([blob], cleanName, { type: mime });
          const previewUrl = URL.createObjectURL(croppedFile);
          onApply(croppedFile, previewUrl);
        },
        "image/webp",
        0.88,
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
              Adjust Cover Photo (16:9)
            </h3>
            <p className="text-xs text-muted">
              {mode === "fit"
                ? "Full photo preserved with zero cropping · Ambient backdrop fills 16:9"
                : "Drag to reposition · Zoom to crop and frame in 16:9"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Framing Mode Selector */}
        <div className="flex items-center gap-1.5 rounded-xl bg-surface-2 p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setMode("fit");
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              mode === "fit"
                ? "bg-accent text-accent-fg shadow-sm"
                : "text-secondary hover:text-white"
            )}
          >
            <Maximize2 className="size-3.5" />
            <span>Fit (Full photo · No cut)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("fill");
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              mode === "fill"
                ? "bg-accent text-accent-fg shadow-sm"
                : "text-secondary hover:text-white"
            )}
          >
            <Crop className="size-3.5" />
            <span>Fill (Crop to 16:9)</span>
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
          {/* Ambient blur backdrop */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full object-cover scale-110 blur-xl opacity-35 select-none"
          />

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
            min="0.6"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-accent cursor-pointer"
            aria-label="Zoom level"
          />
          <ZoomIn className="size-4 text-muted shrink-0" />
          <span className="w-12 text-right font-mono text-xs text-muted">
            {zoom.toFixed(2)}x
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
