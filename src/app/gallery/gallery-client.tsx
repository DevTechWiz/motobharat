"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter } from "lucide-react";
import { MemoriesGrid, type MemoryItem } from "@/components/gallery/memory-card";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

export function GalleryClient({ photos }: { photos: MemoryItem[] }) {
  const [selectedRideId, setSelectedRideId] = useState<string>("all");

  // Extract unique rides that have photos
  const rideFilters = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    photos.forEach((p) => {
      if (p.event?.id && p.event?.title) {
        const existing = map.get(p.event.id);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(p.event.id, {
            id: p.event.id,
            title: p.event.title,
            count: 1,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (selectedRideId === "all") return photos;
    return photos.filter((p) => p.event?.id === selectedRideId);
  }, [photos, selectedRideId]);

  if (photos.length === 0) {
    return (
      <EmptyState
        title="No Photos in the Gallery Yet"
        hint="Photos from upcoming rides and expeditions will be published here by community organizers."
        action={
          <Link
            href="/rides"
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/80 bg-accent/10 px-4 py-2 text-xs font-bold text-accent uppercase transition-colors hover:bg-accent hover:text-black"
          >
            Explore Rides
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Filter bar if multiple rides have photos */}
      {rideFilters.length > 1 && (
        <div className="flex flex-col gap-2.5 sm:gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Filter className="size-3.5" aria-hidden />
            <span>Filter by Ride</span>
            <span className="font-mono text-[10px] text-muted">
              ({filteredPhotos.length} {filteredPhotos.length === 1 ? "photo" : "photos"})
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSelectedRideId("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150",
                selectedRideId === "all"
                  ? "bg-accent text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-surface-2 text-secondary hover:bg-surface-3 hover:text-white border border-border/80"
              )}
            >
              All Rides ({photos.length})
            </button>
            {rideFilters.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRideId(r.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150",
                  selectedRideId === r.id
                    ? "bg-accent text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "bg-surface-2 text-secondary hover:bg-surface-3 hover:text-white border border-border/80"
                )}
              >
                {r.title} ({r.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of memory cards */}
      <MemoriesGrid memories={filteredPhotos} columns="4" />
    </div>
  );
}
