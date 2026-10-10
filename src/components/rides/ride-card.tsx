import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import { formatRideDate, isPast } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Ride } from "@/lib/types";

const difficultyDot: Record<string, string> = {
  easy: "bg-success",
  moderate: "bg-accent",
  hard: "bg-orange",
};

export function RideCard({ ride }: { ride: Ride }) {
  const past = isPast(ride.starts_at) || ride.status === "completed";
  const cancelled = ride.status === "cancelled";
  const href = ride.slug ? `/rides/${ride.slug}` : `/rides/${ride.id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div className="relative aspect-16/10 bg-surface-2">
        {ride.cover_url ? (
          <Image
            src={ride.cover_url}
            alt={ride.title}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
            className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-surface-2 to-surface-3">
            <MapPin className="size-7 text-accent/60" aria-hidden />
            <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
              {ride.meeting_point || "Warangal"}
            </span>
          </div>
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
