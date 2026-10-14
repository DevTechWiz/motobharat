"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { RideRow } from "./ride-row";
import type { Ride } from "@/lib/types";

type StatusFilter = "all" | "draft" | "published" | "completed" | "cancelled";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function RidesTable({ rides }: { rides: Ride[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rides.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (q && !`${r.title} ${r.meeting_point ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rides, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          All Rides{" "}
          <span className="font-mono text-sm font-semibold text-muted tabular-nums">
            ({filtered.length}/{rides.length})
          </span>
        </h2>
        <ButtonLink href="/admin/rides/new" size="sm">
          <Plus className="size-4" aria-hidden />
          New Ride
        </ButtonLink>
      </div>

      {rides.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or meeting point…"
              aria-label="Search rides"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3.5 pl-10 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                aria-pressed={status === f.value}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase transition-colors",
                  status === f.value
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border-strong text-muted hover:border-accent/50 hover:text-text"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={rides.length === 0 ? "No rides yet" : "No rides match"}
          hint={
            rides.length === 0
              ? "Create the first departure — it appears on /rides the moment it is published."
              : "Try a different search or filter."
          }
          action={
            rides.length === 0 ? (
              <ButtonLink href="/admin/rides/new" variant="outline" size="sm">
                <Plus className="size-4" aria-hidden />
                New Ride
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Title</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Date</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Status</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filtered.map((ride) => (
                <RideRow key={ride.id} ride={ride} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
