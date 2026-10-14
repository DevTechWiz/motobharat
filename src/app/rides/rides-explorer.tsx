"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";
import { RideCard } from "@/components/rides/ride-card";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { isPast } from "@/lib/format";
import type { Ride } from "@/lib/types";

type Tab = "upcoming" | "completed" | "cancelled";
const DIFFICULTIES = ["All", "easy", "moderate", "hard"] as const;

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function RidesExplorer({ rides }: { rides: Ride[] }) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rides.filter((ride) => {
      const cancelled = ride.status === "cancelled";
      const completed =
        ride.status === "completed" || (ride.status === "published" && isPast(ride.starts_at));
      if (tab === "upcoming") return !cancelled && !completed;
      if (tab === "completed") return completed;
      return cancelled;
    }).filter((ride) => {
      if (difficulty !== "All" && ride.difficulty !== difficulty) return false;
      if (q) {
        const hay = `${ride.title} ${ride.meeting_point ?? ""} ${ride.description ?? ""}`;
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rides, tab, query, difficulty]);

  const reset = () => {
    setQuery("");
    setDifficulty("All");
  };

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Filter strip */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1 rounded-xl bg-bg p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative min-h-[44px] flex-1 rounded-lg px-3 py-2 text-xs font-bold tracking-wider whitespace-nowrap uppercase transition-[color,transform] duration-150 ease-out active:scale-[0.97] sm:flex-none sm:px-4 md:flex-none",
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
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title or meeting point…"
              aria-label="Search rides"
              className="min-h-[44px] w-full rounded-lg border border-border bg-bg py-2.5 pr-3 pl-9 text-sm text-white placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
          <span className="mr-1 font-mono text-[10px] tracking-wider text-muted uppercase">
            Difficulty
          </span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                "min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97]",
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
        <motion.div layout className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((ride) => (
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
      )}

      {filtered.length > 0 && (
        <p className="text-center font-mono text-[11px] text-muted tabular-nums">
          {filtered.length} {filtered.length === 1 ? "ride" : "rides"}
        </p>
      )}
    </div>
  );
}
