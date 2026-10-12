"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, ArrowUpRight, Compass } from "lucide-react";
import { formatRideDate, isPast } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Ride } from "@/lib/types";

const difficultyDot: Record<string, string> = {
  easy: "bg-success",
  moderate: "bg-accent",
  hard: "bg-orange",
};

function RideCoverFallback({ meetingPoint }: { meetingPoint?: string | null }) {
  return (
    <div className="relative flex size-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#121417] via-[#181B20] to-[#0D0F11] p-4 select-none">
      <svg
        className="absolute inset-0 size-full opacity-15"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 250"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 60 Q100 20 200 70 T400 40 M0 120 Q120 80 240 140 T400 110 M0 180 Q80 160 200 200 T400 170"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-accent"
        />
        <circle cx="340" cy="80" r="40" stroke="currentColor" strokeWidth="1" fill="none" className="text-border-strong" />
        <circle cx="340" cy="80" r="70" stroke="currentColor" strokeWidth="1" fill="none" className="text-border" />
      </svg>
      <div className="relative z-10 flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-accent/80 uppercase">
          MBI · Expedition
        </span>
        <Compass className="size-4 text-accent/50" aria-hidden />
      </div>
      <div className="relative z-10 flex items-center gap-1.5">
        <MapPin className="size-3.5 text-accent shrink-0" aria-hidden />
        <span className="truncate font-mono text-xs font-semibold text-text">
          {meetingPoint || "Warangal Column"}
        </span>
      </div>
    </div>
  );
}

export function RideCard({ ride }: { ride: Ride }) {
  const [imgFailed, setImgFailed] = useState(false);
  const past = isPast(ride.starts_at) || ride.status === "completed";
  const cancelled = ride.status === "cancelled";
  const href = ride.slug ? `/rides/${ride.slug}` : `/rides/${ride.id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-2 hover:shadow-xl hover:shadow-black/40 active:translate-y-0"
    >
      <div className="relative aspect-16/10 bg-surface-2">
        {ride.cover_url && !imgFailed ? (
          <Image
            src={ride.cover_url}
            alt={ride.title}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
            className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <RideCoverFallback meetingPoint={ride.meeting_point} />
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-bg/90 px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur">
          <span
            className={cn(
              "size-1.5 rounded-full",
              cancelled
                ? "bg-danger"
                : past
                  ? "bg-muted"
                  : (difficultyDot[ride.difficulty ?? ""] ?? "bg-accent"),
            )}
            aria-hidden
          />
          <span className={cn(cancelled ? "text-danger" : past ? "text-muted" : "text-accent")}>
            {cancelled ? "Cancelled" : past ? "Completed" : "Upcoming"}
          </span>
        </div>

        {ride.distance_km != null && (
          <div className="absolute right-3 bottom-3 rounded-lg bg-bg/90 px-2 py-0.5 font-mono text-[11px] text-white tabular-nums backdrop-blur">
            {ride.distance_km} km
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
          <span>{formatRideDate(ride.starts_at)}</span>
          {ride.difficulty && (
            <>
              <span aria-hidden className="text-border-strong">·</span>
              <span
                className={cn(
                  "font-semibold",
                  ride.difficulty === "hard" ? "text-orange" : "text-accent",
                )}
              >
                {ride.difficulty}
              </span>
            </>
          )}
        </div>

        <h3 className="text-lg font-bold leading-snug transition-colors group-hover:text-accent">
          {ride.title}
        </h3>

        {ride.meeting_point && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {ride.meeting_point}
          </p>
        )}

        {ride.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-secondary">
            {ride.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted tabular-nums">
          <Clock className="size-3" aria-hidden />
          {new Date(ride.starts_at).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase transition-colors group-hover:text-accent">
          View Ride
          <ArrowUpRight className="size-3.5 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
