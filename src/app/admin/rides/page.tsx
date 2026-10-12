import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatRideDate } from "@/lib/format";
import { DeleteRideButton } from "./delete-ride-button";
import type { Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusTone = {
  draft: "neutral",
  published: "easy",
  completed: "moderate",
  cancelled: "hard",
} as const;

export default async function AdminRidesPage() {
  const supabase = await createClient();
  const { data: rides } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  const list = (rides ?? []) as Ride[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          All Rides{" "}
          <span className="font-mono text-sm font-semibold text-muted tabular-nums">
            ({list.length})
          </span>
        </h2>
        <ButtonLink href="/admin/rides/new" size="sm">
          <Plus className="size-4" aria-hidden />
          New Ride
        </ButtonLink>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No rides yet"
          hint="Create the first departure — it appears on /rides the moment it is published."
          action={
            <ButtonLink href="/admin/rides/new" variant="outline" size="sm">
              <Plus className="size-4" aria-hidden />
              New Ride
            </ButtonLink>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {list.map((ride) => (
                <tr key={ride.id} className="transition-colors hover:bg-surface-2/70">
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
                        href={`/admin/rides/${ride.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        <Pencil className="size-3" aria-hidden /> Edit
                      </Link>
                      <DeleteRideButton rideId={ride.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
