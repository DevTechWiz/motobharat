"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CardQr({ verifyUrl, memberId }: { verifyUrl: string; memberId: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function downloadPng() {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg || busy) return;
    setBusy(true);
    try {
      const data = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("qr raster failed"));
        img.src = url;
      });
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!png) throw new Error("qr raster failed");
      const pngUrl = URL.createObjectURL(png);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `motobharat-verify-${memberId}.png`;
      a.click();
      URL.revokeObjectURL(pngUrl);
    } catch {
      // Canvas raster is best-effort; print remains available.
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(verifyUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = verifyUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }

  async function handleShare() {
    const shareData = {
      title: "MotoBharat Member ID Card",
      text: `Verify my MotoBharat Member ID Card (${memberId}):`,
      url: verifyUrl,
    };

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
      }
    }

    // Fallback if device share is unavailable or failed
    await copyLink();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={wrapRef} className="rounded-xl bg-white p-3 shadow-[0_8px_32px_rgba(0,0,0,.5)]">
        <QRCode value={verifyUrl} size={160} aria-label="Member verification QR code" />
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 w-full max-w-sm sm:max-w-none">
        <Button
          variant="secondary"
          size="sm"
          onClick={downloadPng}
          loading={busy}
          className="!min-h-[36px] sm:!min-h-[40px] px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold tracking-normal sm:tracking-wider justify-center"
        >
          <Download className="size-3 sm:size-4 shrink-0" aria-hidden />
          <span>Download QR</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="!min-h-[36px] sm:!min-h-[40px] px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold tracking-normal sm:tracking-wider justify-center"
        >
          <Share2 className="size-3 sm:size-4 shrink-0" aria-hidden />
          <span>Share</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
          className="!min-h-[36px] sm:!min-h-[40px] px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold tracking-normal sm:tracking-wider justify-center"
        >
          {copied ? (
            <>
              <Check className="size-3 sm:size-4 text-accent shrink-0" aria-hidden />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3 sm:size-4 shrink-0" aria-hidden />
              <span>Copy link</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="!min-h-[36px] sm:!min-h-[40px] px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold tracking-normal sm:tracking-wider justify-center"
        >
          <Printer className="size-3 sm:size-4 shrink-0" aria-hidden />
          <span>Print card</span>
        </Button>
      </div>

      {copied && (
        <p className="animate-fade-in font-mono text-[11px] sm:text-xs font-semibold text-accent">
          Link copied to clipboard!
        </p>
      )}
    </div>
  );
}
