"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";
import { RideCard } from "@/components/rides/ride-card";
import { EmptyState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/cn";
import { getEffectiveRideStatus } from "@/lib/format";
import type { Ride } from "@/lib/types";

type Tab = "all" | "upcoming" | "completed" | "cancelled";
const DIFFICULTIES = ["All", "easy", "moderate", "hard"] as const;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 9;

export function RidesExplorer({ rides }: { rides: Ride[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("All");
  const [page, setPage] = useState(1);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const handleDifficultyChange = (d: (typeof DIFFICULTIES)[number]) => {
    setDifficulty(d);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rides.filter((ride) => {
      const effective = getEffectiveRideStatus(ride.status, ride.starts_at);
      if (tab === "upcoming") return effective === "published";
      if (tab === "completed") return effective === "completed";
      if (tab === "cancelled") return effective === "cancelled";
      return true;
    }).filter((ride) => {
      if (difficulty !== "All" && ride.difficulty !== difficulty) return false;
      if (q) {
        const hay = `${ride.title} ${ride.meeting_point ?? ""} ${ride.description ?? ""}`;
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rides, tab, query, difficulty]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const reset = () => {
    setQuery("");
    setDifficulty("All");
    setTab("all");
    setPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Filter strip */}
      <div className="space-y-2.5 sm:space-y-3 rounded-xl border border-border bg-surface p-2.5 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1 rounded-xl bg-bg p-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={cn(
                  "relative min-h-[36px] sm:min-h-[44px] flex-1 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-normal sm:tracking-wider whitespace-nowrap uppercase transition-[color,transform] duration-150 ease-out active:scale-[0.97] sm:flex-none md:flex-none",
                  tab === t.key ? "text-accent-fg" : "text-secondary hover:text-white"
                )}
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="rides-tab-pill"
                    className="absolute inset-0 rounded-lg bg-accent shadow-[0_8px_24px_-8px_var(--accent)]"
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 sm:size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Filter by title or meeting point…"
              aria-label="Search rides"
              className="min-h-[38px] sm:min-h-[44px] w-full rounded-lg border border-border bg-bg py-2 pr-3 pl-8.5 sm:pl-9 text-xs sm:text-sm text-white placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-t border-border pt-2 sm:pt-2.5">
          <span className="mr-1 font-mono text-[9px] sm:text-[10px] tracking-wider text-muted uppercase">
            Difficulty
          </span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDifficultyChange(d)}
              className={cn(
                "min-h-[30px] sm:min-h-[36px] rounded-lg px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97]",
                difficulty === d
                  ? "bg-surface-3 text-white"
                  : "text-secondary hover:text-white",
              )}
            >
              {d === "All" ? "All" : d}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="relative">
          <EmptyState
            title="No rides match your filter"
            hint="Try a different difficulty, clear the search, or switch tabs."
          />
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:border-accent/50 hover:bg-surface-2 active:scale-[0.97]"
            >
              <X className="size-3.5" aria-hidden />
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <motion.div layout className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {paginated.map((ride) => (
                <motion.div
                  key={ride.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                >
                  <RideCard ride={ride} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center font-mono text-[11px] text-muted tabular-nums">
          {filtered.length} {filtered.length === 1 ? "ride" : "rides"}
        </p>
      )}
    </div>
  );
}
