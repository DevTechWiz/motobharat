"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRideDate } from "@/lib/format";
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
      <td className="px-4 py-3">
        <p className="font-semibold">{ride.title}</p>
        {ride.meeting_point && (
          <p className="mt-0.5 text-xs text-muted">{ride.meeting_point}</p>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-secondary tabular-nums">
        {formatRideDate(ride.starts_at)}
      </td>
      <td className="px-4 py-3">
        <Badge tone={statusTone[ride.status]}>{ride.status}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-accent/50 hover:text-accent"
          >
            <Pencil className="size-3" aria-hidden /> Edit
          </Link>
          <DeleteRideButton rideId={ride.id} />
        </div>
      </td>
    </tr>
  );
}
