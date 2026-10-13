import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { RideRow } from "./ride-row";
import type { Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

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
                <RideRow key={ride.id} ride={ride} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
