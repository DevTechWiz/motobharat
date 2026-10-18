"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/format";
import { DeleteStoryButton } from "./delete-story-button";
import type { Story, StoryCategory } from "@/lib/types";

const CATEGORY_TONE: Record<
  StoryCategory,
  "easy" | "moderate" | "hard" | "neutral"
> = {
  achievement: "moderate",
  tour_story: "easy",
  milestone: "hard",
  spotlight: "neutral",
};

const PAGE_SIZE = 10;

export function StoriesList({ stories }: { stories: Story[] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(stories.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return stories.slice(start, start + PAGE_SIZE);
  }, [stories, currentPage]);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {paginated.map((s) => (
          <li
            key={s.id}
            className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg sm:rounded-xl border border-border bg-surface px-3 sm:px-4 py-2.5 transition-all duration-200 hover:border-accent/40 hover:bg-surface-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={CATEGORY_TONE[s.category] ?? "neutral"}>
                  {s.category.replace("_", " ")}
                </Badge>
                <p className="font-semibold text-xs sm:text-sm md:text-base text-text truncate">
                  <Link
                    href={`/admin/stories/${s.id}/edit`}
                    className="transition-colors hover:text-accent"
                  >
                    {s.title}
                  </Link>
                </p>
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-muted flex items-center gap-2">
                <span>{formatDate(s.created_at)}</span>
                {s.rider_name && (
                  <>
                    <span aria-hidden className="text-border-strong">
                      ·
                    </span>
                    <span className="text-secondary font-medium">
                      {s.rider_name}
                    </span>
                  </>
                )}
                {s.rider_bike && (
                  <>
                    <span aria-hidden className="text-border-strong">
                      ·
                    </span>
                    <span>{s.rider_bike}</span>
                  </>
                )}
              </p>
            </div>

            <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-center">
              <Link
                href={`/stories/${s.slug || s.id}`}
                target="_blank"
                className="rounded-md sm:rounded-lg border border-border px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-secondary transition-colors hover:border-accent hover:text-white"
              >
                View
              </Link>
              <Link
                href={`/admin/stories/${s.id}/edit`}
                className="rounded-md sm:rounded-lg border border-border-strong px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-colors hover:bg-surface-2"
              >
                Edit
              </Link>
              <DeleteStoryButton id={s.id} />
            </div>
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={stories.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
