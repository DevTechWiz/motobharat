"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/format";
import { DeleteAnnouncementButton } from "./delete-announcement-button";
import type { Announcement } from "@/lib/types";

const PAGE_SIZE = 10;

export function AnnouncementsList({ items }: { items: Announcement[] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {paginated.map((a) => (
          <li
            key={a.id}
            className="relative flex items-center justify-between gap-3 rounded-lg sm:rounded-xl border border-border bg-surface px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-200 hover:border-accent/40 hover:bg-surface-2"
          >
            <div>
              <p className="font-semibold text-xs sm:text-sm md:text-base">
                <Link
                  href={`/admin/announcements/${a.id}/edit`}
                  className="transition-colors after:absolute after:inset-0 hover:text-accent focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent focus-visible:after:ring-inset focus-visible:after:rounded-xl"
                >
                  {a.title}
                </Link>
              </p>
              <p className="text-[11px] sm:text-xs text-muted">{formatDate(a.created_at)}</p>
            </div>
            <div className="relative flex items-center gap-1.5 sm:gap-2">
              <Link
                href={`/admin/announcements/${a.id}/edit`}
                className="rounded-md sm:rounded-lg border border-border-strong px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-colors hover:bg-surface-2"
              >
                Edit
              </Link>
              <DeleteAnnouncementButton id={a.id} />
            </div>
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
