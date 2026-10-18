"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/cn";
import { getEffectiveRideStatus } from "@/lib/format";
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

const PAGE_SIZE = 10;

export function RidesTable({ rides }: { rides: Ride[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const handleStatusChange = (newStatus: StatusFilter) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rides.filter((r) => {
      const effective = getEffectiveRideStatus(r.status, r.starts_at);
      if (status !== "all" && effective !== status) return false;
      if (q && !`${r.title} ${r.meeting_point ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rides, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <h2 className="text-base sm:text-lg font-bold">
          All Rides{" "}
          <span className="font-mono text-xs sm:text-sm font-semibold text-muted tabular-nums">
            ({filtered.length}/{rides.length})
          </span>
        </h2>
        <ButtonLink href="/admin/rides/new" size="sm">
          <Plus className="size-3.5 sm:size-4" aria-hidden />
          New Ride
        </ButtonLink>
      </div>

      {rides.length > 0 && (
        <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search title or meeting point…"
              aria-label="Search rides"
              className="w-full rounded-lg border border-border bg-surface py-2 sm:py-2.5 pr-3 pl-9 text-xs sm:text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleStatusChange(f.value)}
                aria-pressed={status === f.value}
                className={cn(
                  "rounded-full border px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors",
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
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[11px] sm:text-xs text-muted">
                  <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold">Title</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold">Date</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold">Status</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {paginated.map((ride) => (
                  <RideRow key={ride.id} ride={ride} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
