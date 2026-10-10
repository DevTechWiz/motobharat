import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">All Rides ({list.length})</h2>
        <Link
          href="/admin/rides/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-bg hover:bg-accent-hover"
        >
          + New Ride
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted">No rides yet.</p>
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
                <tr key={ride.id}>
                  <td className="px-4 py-3 font-semibold">{ride.title}</td>
                  <td className="px-4 py-3 text-secondary">{formatRideDate(ride.starts_at)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[ride.status]}>{ride.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/rides/${ride.id}/edit`}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
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
