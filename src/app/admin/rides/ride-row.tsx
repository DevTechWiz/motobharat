"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRideDate, getEffectiveRideStatus } from "@/lib/format";
import { DeleteRideButton } from "./delete-ride-button";
import type { Ride } from "@/lib/types";

const statusTone = {
  draft: "neutral",
  published: "easy",
  completed: "moderate",
  cancelled: "hard",
} as const;

// Whole-row click opens the edit screen; inner Edit/Delete controls keep
// working (clicks on links and buttons are left alone).
export function RideRow({ ride }: { ride: Ride }) {
  const router = useRouter();
  const href = `/admin/rides/${ride.id}/edit`;
  const open = () => router.push(href);
  const effective = getEffectiveRideStatus(ride.status, ride.starts_at);

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Edit ${ride.title}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button")) return;
        open();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className="cursor-pointer transition-colors outline-none hover:bg-surface-2/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
    >
      <td className="px-3 sm:px-4 py-2 sm:py-2.5">
        <p className="font-semibold text-xs sm:text-sm">{ride.title}</p>
        {ride.meeting_point && (
          <p className="mt-0.5 text-[11px] sm:text-xs text-muted">{ride.meeting_point}</p>
        )}
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[11px] sm:text-xs text-secondary tabular-nums">
        {formatRideDate(ride.starts_at)}
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-2.5">
        <Badge tone={statusTone[effective]}>{effective}</Badge>
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-md sm:rounded-lg border border-border px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors hover:border-accent/50 hover:text-accent"
          >
            <Pencil className="size-3" aria-hidden /> Edit
          </Link>
          <DeleteRideButton rideId={ride.id} />
        </div>
      </td>
    </tr>
  );
}
