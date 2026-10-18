"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  Lock,
  Layers,
  CreditCard,
  Download,
  Share2,
  Copy,
  Check,
  Printer,
  HeartPulse,
  Phone,
  Scissors,
  MapPin,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

interface MemberCardViewerProps {
  memberId: string;
  fullName: string;
  role?: string | null;
  city: string;
  avatarUrl: string | null;
  createdAt: string;
  isRegistered: boolean;
  isRejected: boolean;
  isPending: boolean;
  bikeModel?: string | null;
  bikeRegNo?: string | null;
  bloodGroup?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  verifyUrl: string;
  memberType?: "rider" | "pillion" | null;
}

export function MemberCardViewer({
  memberId,
  fullName,
  role,
  city,
  avatarUrl,
  createdAt,
  isRegistered,
  isRejected,
  isPending,
  bikeModel,
  bikeRegNo,
  bloodGroup,
  emergencyContactName,
  emergencyContactPhone,
  emergencyContactRelation,
  verifyUrl,
  memberType = "rider",
}: MemberCardViewerProps) {
  // Mode: "two-sided" (Option B: Front & Back) | "single" (Option A: All-in-one badge)
  const [cardMode, setCardMode] = useState<"two-sided" | "single">("two-sided");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  async function downloadPng() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || busy) return;
    setBusy(true);
    try {
      const data = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
      const img = new window.Image();
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
      // Best effort
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

    await copyLink();
  }

  return (
    <div className="space-y-6">
      {/* Format Selector Pills (hidden on print) */}
      {isRegistered && (
        <div className="card-print-hide flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border border-border bg-surface-2 p-1.5 sm:p-2.5">
          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border/80 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCardMode("two-sided")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all ${
                cardMode === "two-sided"
                  ? "bg-accent text-accent-fg shadow-sm"
                  : "text-secondary hover:text-white"
              }`}
            >
              <Layers className="size-3 sm:size-3.5" aria-hidden />
              <span>Two-Sided (Front & Back)</span>
            </button>
            <button
              type="button"
              onClick={() => setCardMode("single")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all ${
                cardMode === "single"
                  ? "bg-accent text-accent-fg shadow-sm"
                  : "text-secondary hover:text-white"
              }`}
            >
              <CreditCard className="size-3 sm:size-3.5" aria-hidden />
              <span>Single Badge</span>
            </button>
          </div>

          <p className="text-[10px] sm:text-[11px] text-muted font-mono px-1 sm:px-2">
            {cardMode === "two-sided"
              ? "Standard CR80 ID rules (85.6mm × 54mm) · Stacked for fold & cut"
              : "Executive single-sided card (85.6mm × 54mm) · Ideal for badge pouches"}
          </p>
        </div>
      )}

      {/* Hidden QR element for high-res raster download */}
      <div className="hidden" aria-hidden>
        <div ref={qrRef}>
          <QRCode value={verifyUrl} size={1024} />
        </div>
      </div>

      {/* The Printable Area */}
      <div className="card-print-area">
        {cardMode === "two-sided" ? (
          /* ==========================================================
             TWO-SIDED CARD (Option B: Front & Back)
             ========================================================== */
          <div className="space-y-6 print:space-y-0 print:flex print:flex-col print:items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:flex print:flex-col print:items-center print:gap-0">
              {/* FRONT CARD */}
              <div className="id-card-cr80 relative overflow-hidden rounded-2xl border border-border/90 bg-gradient-to-br from-surface to-surface-2 p-3 sm:p-5 md:p-6 shadow-xl flex flex-col justify-between min-h-[200px] sm:min-h-[260px] print:min-h-0 print:p-[3.2mm]">
                {/* Subtle accent glow (screen only) */}
                <div
                  className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-accent/10 blur-[80px] print:hidden"
                  aria-hidden
                />

                <div>
                  {/* Front Card Header */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-border/70 pb-2 sm:pb-3.5 print:pb-[2mm] print:border-white/20">
                    <div className="flex items-center gap-1.5 sm:gap-2.5 print:gap-1.5">
                      <Image
                        src="/brand/logo-128.png"
                        alt="MotoBharat emblem"
                        width={36}
                        height={36}
                        className="size-6 sm:size-9 rounded-full ring-1 ring-border print:size-6"
                      />
                      <div>
                        <p className="text-[11px] sm:text-sm font-black tracking-tight text-white print:text-[8.5pt] print:leading-tight">
                          MOTOBHARAT
                        </p>
                        <p className="font-mono text-[7px] sm:text-[9px] print:text-[6.5pt] tracking-[0.16em] text-accent font-semibold uppercase">
                          {memberType === "pillion" ? "Warangal Pillions" : "Warangal Riders"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded bg-accent/20 px-1.5 sm:px-2 py-0.5 print:px-1 print:py-0 font-mono text-[7.5px] sm:text-[10px] print:text-[6pt] font-bold text-accent border border-accent/40">
                        FRONT
                      </span>
                      <p className="font-mono text-[10px] sm:text-xs print:text-[7pt] font-bold tracking-wider sm:tracking-widest text-white mt-0.5">
                        {memberId}
                      </p>
                    </div>
                  </div>

                  {/* Rider Profile Row */}
                  <div className="mt-2.5 sm:mt-4 print:mt-[2mm] flex items-center gap-2.5 sm:gap-4 print:gap-2.5">
                    <div className="relative shrink-0">
                      <Avatar src={avatarUrl} name={fullName} size="lg" className="size-10 sm:size-16 md:size-20 ring-2 ring-accent/30 print:size-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-lg md:text-xl font-black tracking-tight text-white print:text-[10pt] print:leading-tight">
                        {fullName}
                      </p>
                      <div className="mt-1 sm:mt-1.5 print:mt-[1mm] flex flex-wrap items-center gap-1 sm:gap-1.5">
                        {role === "admin" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-1.5 sm:px-2 py-0.5 print:px-1.5 print:py-0 text-[7.5px] sm:text-[9.5px] print:text-[5.5pt] font-bold text-accent uppercase">
                            Admin
                          </span>
                        )}
                        {isRegistered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-1.5 sm:px-2 py-0.5 print:px-1.5 print:py-0 text-[7.5px] sm:text-[9.5px] print:text-[5.5pt] font-bold text-emerald-400">
                            <ShieldCheck className="size-2 sm:size-2.5" aria-hidden /> {memberType === "pillion" ? "Registered Pillion" : "Registered Rider"}
                          </span>
                        ) : (
                          <>
                            <Badge tone={isRejected ? "danger" : "moderate"} className="text-[7.5px] sm:text-xs">
                              {isRejected ? "KYC Rejected" : isPending ? "Review Pending" : "KYC Pending"}
                            </Badge>
                            <Badge tone="danger" className="text-[7.5px] sm:text-xs">
                              <Lock className="size-2 sm:size-2.5" aria-hidden /> Card Locked
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="text-[9px] sm:text-xs print:text-[6.5pt] text-gray-300 mt-1 print:mt-[0.5mm] print:leading-tight truncate flex items-center gap-1">
                        <MapPin className="size-2.5 sm:size-3 text-accent shrink-0 inline print:hidden" aria-hidden />
                        <span>{city || "Warangal"}</span>
                        <span className="text-gray-500">·</span>
                        <span>Member since {formatDate(createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Machine & Blood Info */}
                {memberType === "pillion" ? (
                  <div className="mt-2.5 sm:mt-5 print:mt-[2mm] grid grid-cols-2 gap-1.5 sm:gap-2 border-t border-border/70 print:border-white/20 pt-1.5 sm:pt-3 print:pt-[1.5mm] text-xs">
                    <div>
                      <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Role</span>
                      <span className="block truncate font-bold text-[10px] sm:text-xs text-white print:text-[7pt] print:leading-tight">
                        Pillion / Co-Rider
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Blood Group</span>
                      <span className="block font-bold text-[10px] sm:text-xs text-accent print:text-[7.5pt] print:leading-tight">
                        {isRegistered ? bloodGroup || "—" : "•••"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 sm:mt-5 print:mt-[2mm] grid grid-cols-3 gap-1.5 sm:gap-2 border-t border-border/70 print:border-white/20 pt-1.5 sm:pt-3 print:pt-[1.5mm] text-xs">
                    <div>
                      <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Machine</span>
                      <span className="block truncate font-bold text-[10px] sm:text-xs text-white print:text-[7pt] print:leading-tight">
                        {isRegistered ? bikeModel || "—" : "•••"}
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Plate No.</span>
                      <span className="block font-mono font-bold uppercase text-[10px] sm:text-xs text-white print:text-[7pt] print:leading-tight">
                        {isRegistered ? bikeRegNo || "—" : "•••"}
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Blood Group</span>
                      <span className="block font-bold text-[10px] sm:text-xs text-accent print:text-[7.5pt] print:leading-tight">
                        {isRegistered ? bloodGroup || "—" : "•••"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Print Fold Guide (visible only during print between front & back cards in column) */}
              <div className="hidden print:flex items-center justify-center gap-2 py-1 text-[7pt] font-mono text-gray-400 border-t border-dashed border-gray-400 w-[85.6mm] my-1">
                <Scissors className="size-2.5" aria-hidden />
                <span>Fold along this line (back-to-back) or cut</span>
              </div>

              {/* BACK CARD */}
              <div className="id-card-cr80 relative overflow-hidden rounded-2xl border border-border/90 bg-gradient-to-br from-surface to-surface-2 p-3 sm:p-5 md:p-6 shadow-xl flex flex-col justify-between min-h-[200px] sm:min-h-[260px] print:min-h-0 print:p-[3.2mm]">
                <div>
                  {/* Back Card Header */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-border/70 pb-2 sm:pb-3.5 print:pb-[2mm] print:border-white/20">
                    <div>
                      <p className="text-[10.5px] sm:text-sm font-black tracking-tight text-white print:text-[8pt] print:leading-tight">
                        SAFETY & EMERGENCY (ICE)
                      </p>
                      <p className="font-mono text-[7px] sm:text-[9px] print:text-[6.5pt] tracking-[0.14em] text-accent font-semibold uppercase">
                        MOTOBHARAT {memberType === "pillion" ? "PILLION" : "RIDER"} Credentials
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded bg-surface-3 px-1.5 sm:px-2 py-0.5 print:px-1 print:py-0 font-mono text-[7.5px] sm:text-[10px] print:text-[6pt] font-bold text-gray-300 border border-white/20">
                        BACK
                      </span>
                    </div>
                  </div>

                  {/* Back Body: Emergency ICE + Verification QR */}
                  <div className="mt-2.5 sm:mt-4 print:mt-[2mm] grid grid-cols-[1fr_auto] gap-2 sm:gap-4 print:gap-2 items-center">
                    {/* Emergency details */}
                    <div className="space-y-1 sm:space-y-2.5 print:space-y-[1.5mm] min-w-0">
                      <div>
                        <div className="flex items-center gap-1 sm:gap-1.5 text-rose-400 print:text-[6.5pt]">
                          <HeartPulse className="size-2.5 sm:size-3.5 print:size-2.5 shrink-0" aria-hidden />
                          <span className="font-mono text-[7px] sm:text-[9px] print:text-[6pt] font-bold tracking-wider uppercase">
                            Emergency Contact (ICE)
                          </span>
                        </div>
                        <p className="mt-0.5 font-bold text-[11px] sm:text-sm text-white print:text-[7.5pt] print:leading-tight truncate">
                          {isRegistered
                            ? emergencyContactName
                              ? `${emergencyContactName}${emergencyContactRelation ? ` (${emergencyContactRelation})` : ""}`
                              : "Not provided"
                            : "•••"}
                        </p>
                        {isRegistered && emergencyContactPhone && (
                          <p className="font-mono text-[9px] sm:text-xs print:text-[6.5pt] text-gray-300 flex items-center gap-1 mt-0.5">
                            <Phone className="size-2 sm:size-3 print:size-2 text-gray-400 shrink-0" aria-hidden />
                            <span>{emergencyContactPhone}</span>
                          </p>
                        )}
                      </div>

                      <div className="rounded-md sm:rounded-lg border border-border/60 print:border-white/20 bg-surface/50 p-1 sm:p-2 print:p-1 text-[7.5px] sm:text-[10px] print:text-[5.5pt] text-gray-300 leading-snug sm:leading-relaxed print:leading-tight">
                        <strong className="text-white font-semibold">Rider Code:</strong> Riding gear mandatory · Non-transferable community credential.
                      </div>
                    </div>

                    {/* Integrated QR box */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="rounded-lg sm:rounded-xl bg-white p-1 sm:p-2 shadow-md print:p-1">
                        <QRCode value={verifyUrl} size={60} aria-label="Member verification QR code" className="size-[48px] sm:size-[80px] print:size-[19mm]" />
                      </div>
                      <p className="mt-0.5 sm:mt-1 text-[6px] sm:text-[8px] print:text-[5pt] font-mono text-gray-300 text-center tracking-tight">
                        Scan to verify
                      </p>
                      <p className="text-[6.5px] sm:text-[8px] print:text-[5.5pt] font-mono text-accent font-semibold">
                        motobharat.co
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back Footer */}
                <div className="mt-2.5 sm:mt-4 print:mt-[1.5mm] border-t border-border/70 print:border-white/20 pt-1 sm:pt-2.5 print:pt-[1mm] flex items-center justify-between text-[7.5px] sm:text-[10px] print:text-[5.5pt] font-mono text-gray-400">
                  <span>MotoBharat Warangal</span>
                  <span>ID: {memberId}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================================
             SINGLE BADGE (Option A: All-in-One Executive Card)
             ========================================================== */
          <div className="mx-auto max-w-xl print:max-w-none print:flex print:justify-center">
            <div className="id-card-cr80 relative overflow-hidden rounded-2xl border border-border/90 bg-gradient-to-br from-surface to-surface-2 p-3 sm:p-6 md:p-7 shadow-xl flex flex-col justify-between min-h-[210px] sm:min-h-[300px] print:min-h-0 print:p-[3.2mm]">
              {/* Subtle accent glow */}
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/10 blur-[90px] print:hidden"
                aria-hidden
              />

              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2.5 sm:gap-4 border-b border-border/70 pb-2 sm:pb-3.5 print:pb-[2mm] print:border-white/20">
                  <div className="flex items-center gap-1.5 sm:gap-3 print:gap-1.5">
                    <Image
                      src="/brand/logo-128.png"
                      alt="MotoBharat emblem"
                      width={40}
                      height={40}
                      className="size-6 sm:size-10 rounded-full ring-1 ring-border print:size-6"
                    />
                    <div>
                      <p className="text-[11px] sm:text-sm font-black tracking-tight text-white print:text-[8.5pt] print:leading-tight">
                        MOTOBHARAT
                      </p>
                      <p className="font-mono text-[7px] sm:text-[10px] print:text-[6.5pt] tracking-[0.16em] text-accent font-semibold uppercase">
                        Warangal Riders Chapter
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded bg-accent/20 px-1.5 sm:px-2 py-0.5 print:px-1 print:py-0 font-mono text-[7.5px] sm:text-[10px] print:text-[6pt] font-bold text-accent border border-accent/40">
                      OFFICIAL BADGE
                    </span>
                    <p className="font-mono text-[10px] sm:text-sm print:text-[7pt] font-bold tracking-wider sm:tracking-widest text-white mt-0.5">
                      {memberId}
                    </p>
                  </div>
                </div>

                {/* Middle Row: Avatar, Identity & Integrated QR */}
                <div className="mt-2.5 sm:mt-5 print:mt-[2mm] grid grid-cols-[1fr_auto] gap-2 sm:gap-4 print:gap-2 items-center">
                  <div className="flex items-center gap-2 sm:gap-4 print:gap-2 min-w-0">
                    <Avatar src={avatarUrl} name={fullName} size="lg" className="size-10 sm:size-16 md:size-20 ring-2 ring-accent/30 shrink-0 print:size-8" />
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-xl font-black tracking-tight text-white print:text-[10pt] print:leading-tight">
                        {fullName}
                      </p>
                      <div className="mt-1 sm:mt-1.5 print:mt-[1mm] flex flex-wrap items-center gap-1 sm:gap-1.5">
                        {role === "admin" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-1.5 sm:px-2 py-0.5 print:px-1.5 print:py-0 text-[7.5px] sm:text-[9.5px] print:text-[5.5pt] font-bold text-accent uppercase">
                            Admin
                          </span>
                        )}
                        {isRegistered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-1.5 sm:px-2 py-0.5 print:px-1.5 print:py-0 text-[7.5px] sm:text-[9.5px] print:text-[5.5pt] font-bold text-emerald-400">
                            <ShieldCheck className="size-2 sm:size-2.5" aria-hidden /> {memberType === "pillion" ? "Registered Pillion" : "Registered Rider"}
                          </span>
                        ) : (
                          <>
                            <Badge tone={isRejected ? "danger" : "moderate"} className="text-[7.5px] sm:text-xs">
                              {isRejected ? "KYC Rejected" : isPending ? "Approval Pending" : "KYC Pending"}
                            </Badge>
                            <Badge tone="danger" className="text-[7.5px] sm:text-xs">
                              <Lock className="size-2 sm:size-2.5" aria-hidden /> Card Locked
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="mt-1 print:mt-[0.5mm] text-[9px] sm:text-sm text-gray-300 print:text-[6.5pt] print:leading-tight truncate flex items-center gap-1">
                        <MapPin className="size-2.5 sm:size-3 text-accent shrink-0 inline print:hidden" aria-hidden />
                        <span>{city || "Warangal"}</span>
                        <span className="text-gray-500">·</span>
                        <span>Member since {formatDate(createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* QR Box */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="rounded-lg sm:rounded-xl bg-white p-1 sm:p-2 shadow-md print:p-1">
                      <QRCode value={verifyUrl} size={60} aria-label="Member verification QR code" className="size-[48px] sm:size-[80px] print:size-[19mm]" />
                    </div>
                    <p className="mt-0.5 sm:mt-1 text-[6px] sm:text-[8px] print:text-[5pt] font-mono text-gray-300 text-center tracking-tight">
                      Scan to verify
                    </p>
                    <p className="text-[6.5px] sm:text-[8px] print:text-[5.5pt] font-mono text-accent font-semibold">
                      motobharat.co
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Strip: Machine, Plate, Blood, Emergency */}
              {memberType === "pillion" ? (
                <div className="mt-2.5 sm:mt-5 print:mt-[2mm] grid grid-cols-3 gap-1.5 sm:gap-3 print:gap-1.5 border-t border-border/70 print:border-white/20 pt-2 sm:pt-4 print:pt-[1.5mm] text-xs">
                  <div>
                    <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Role</span>
                    <span className="block truncate font-bold text-[9.5px] sm:text-xs text-white print:text-[7pt] print:leading-tight">
                      Pillion / Co-Rider
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Blood Group</span>
                    <span className="block font-bold text-[9.5px] sm:text-xs text-accent print:text-[7.5pt] print:leading-tight">
                      {isRegistered ? bloodGroup || "—" : "•••"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-rose-400 font-semibold uppercase">Emergency ICE</span>
                    <span className="block truncate font-bold text-[9.5px] sm:text-xs text-white print:text-[7pt] print:leading-tight" title={emergencyContactPhone || ""}>
                      {isRegistered ? emergencyContactPhone || emergencyContactName || "—" : "•••"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 sm:mt-5 print:mt-[2mm] grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 print:gap-1.5 border-t border-border/70 print:border-white/20 pt-2 sm:pt-4 print:pt-[1.5mm] text-xs">
                  <div>
                    <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Machine</span>
                    <span className="block truncate font-bold text-[9.5px] sm:text-xs text-white print:text-[7pt] print:leading-tight">
                      {isRegistered ? bikeModel || "—" : "•••"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Plate No.</span>
                    <span className="block font-mono font-bold uppercase text-[9.5px] sm:text-xs text-white print:text-[7pt] print:leading-tight">
                      {isRegistered ? bikeRegNo || "—" : "•••"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-gray-400 uppercase">Blood Group</span>
                    <span className="block font-bold text-[9.5px] sm:text-xs text-accent print:text-[7.5pt] print:leading-tight">
                      {isRegistered ? bloodGroup || "—" : "•••"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[7px] sm:text-[9px] print:text-[6pt] text-rose-400 font-semibold uppercase">Emergency ICE</span>
                    <span className="block truncate font-bold text-[9.5px] sm:text-xs text-white print:text-[7pt] print:leading-tight" title={emergencyContactPhone || ""}>
                      {isRegistered ? emergencyContactPhone || emergencyContactName || "—" : "•••"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (Download QR, Share, Copy Link, Print Card) */}
      {isRegistered && (
        <div className="card-print-hide flex flex-col items-center gap-3 pt-2 w-full">
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

          <p className="max-w-md text-center text-[11px] sm:text-xs leading-relaxed text-muted px-2">
            The verification QR code is embedded directly on the card so your physical card or printout can be verified instantly by marshals and ride leaders.
          </p>
        </div>
      )}
    </div>
  );
}
