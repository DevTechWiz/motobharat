"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CardQr({ verifyUrl, memberId }: { verifyUrl: string; memberId: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={wrapRef} className="rounded-xl bg-white p-3 shadow-[0_8px_32px_rgba(0,0,0,.5)]">
        <QRCode value={verifyUrl} size={160} aria-label="Member verification QR code" />
      </div>
      <p className="max-w-xs text-center font-mono text-[11px] break-all text-muted">{verifyUrl}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={downloadPng} loading={busy}>
          <Download className="size-4" aria-hidden /> Download QR
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Print card
        </Button>
      </div>
    </div>
  );
}
