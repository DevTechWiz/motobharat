"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems === undefined) {
    return null;
  }

  // Calculate range text if totalItems is provided
  let rangeText: string | null = null;
  if (totalItems !== undefined && pageSize !== undefined && totalItems > 0) {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    rangeText = `Showing ${start}–${end} of ${totalItems}`;
  }

  if (totalPages <= 1) {
    if (!rangeText) return null;
    return (
      <div className={cn("flex items-center justify-between py-2 text-xs text-muted font-mono", className)}>
        <span>{rangeText}</span>
      </div>
    );
  }

  // Generate page numbers with ellipses if many pages
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-border/70 text-xs",
        className
      )}
    >
      <div className="text-muted font-mono text-[11px] sm:text-xs">
        {rangeText ?? `Page ${currentPage} of ${totalPages}`}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5" role="navigation" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 font-mono text-xs font-semibold text-text transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === "ellipsis" ? (
              <span key={`ell-${idx}`} className="px-1.5 text-muted font-mono">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={currentPage === p ? "page" : undefined}
                className={cn(
                  "min-w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors flex items-center justify-center px-2",
                  currentPage === p
                    ? "bg-accent text-accent-fg font-bold shadow-[0_2px_10px_var(--accent)]"
                    : "border border-border bg-surface text-secondary hover:border-accent/50 hover:text-text"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 font-mono text-xs font-semibold text-text transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
