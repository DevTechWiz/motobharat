"use client";

import { cn } from "@/lib/cn";

export function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={cn("mask-fade-x overflow-hidden", className)} aria-hidden>
      <div className="animate-marquee flex w-max items-center gap-8 pr-8">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-8 font-mono text-[11px] font-bold tracking-[0.24em] whitespace-nowrap text-muted uppercase"
          >
            {item}
            <span className="inline-block size-1.5 bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
