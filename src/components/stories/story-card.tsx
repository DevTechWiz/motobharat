"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Award, Compass, User, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Story, StoryCategory } from "@/lib/types";

const CATEGORY_META: Record<
  StoryCategory,
  { label: string; tone: "easy" | "moderate" | "hard" | "neutral" }
> = {
  achievement: { label: "Achievement", tone: "moderate" },
  tour_story: { label: "Tour Story", tone: "easy" },
  milestone: { label: "Milestone", tone: "hard" },
  spotlight: { label: "Spotlight", tone: "neutral" },
};

function StoryCoverFallback({ title }: { title: string }) {
  return (
    <div className="relative flex size-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#121417] via-[#181B20] to-[#0D0F11] p-4 select-none">
      <svg
        className="absolute inset-0 size-full opacity-15"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 250"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 60 Q100 20 200 70 T400 40 M0 120 Q120 80 240 140 T400 110 M0 180 Q80 160 200 200 T400 170"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-accent"
        />
        <circle cx="340" cy="80" r="40" stroke="currentColor" strokeWidth="1" fill="none" className="text-border-strong" />
        <circle cx="340" cy="80" r="70" stroke="currentColor" strokeWidth="1" fill="none" className="text-border" />
      </svg>
      <div className="relative z-10 flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-accent/80 uppercase">
          MBI · Chronicle
        </span>
        <Compass className="size-4 text-accent/50" aria-hidden />
      </div>
      <div className="relative z-10 flex items-center gap-1.5">
        <Award className="size-3.5 text-accent shrink-0" aria-hidden />
        <span className="truncate font-mono text-xs font-semibold text-text">
          {title}
        </span>
      </div>
    </div>
  );
}

export function StoryCard({ story }: { story: Story }) {
  const [imgFailed, setImgFailed] = useState(false);
  const href = story.slug ? `/stories/${story.slug}` : `/stories/${story.id}`;
  const categoryConfig = CATEGORY_META[story.category] ?? CATEGORY_META.achievement;
  const leadStat = story.stats?.[0];

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-accent/40 hover:bg-surface-2 hover:shadow-[0_24px_60px_-20px_rgba(245,158,11,0.4),0_16px_40px_-16px_rgba(0,0,0,0.6)] active:scale-[0.97]"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {story.cover_url && !imgFailed ? (
          <Image
            src={story.cover_url}
            alt={story.title}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <StoryCoverFallback title={story.title} />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge tone={categoryConfig.tone}>{categoryConfig.label}</Badge>
        </div>

        {leadStat && (
          <div className="absolute right-3 bottom-3 rounded-lg bg-bg/90 px-2 py-0.5 font-mono text-[11px] text-white tabular-nums backdrop-blur">
            {leadStat.value}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-secondary">
          <span>{formatDate(story.created_at)}</span>
          {story.rider_name && (
            <>
              <span aria-hidden className="text-border-strong">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-text">
                <User className="size-3 text-accent shrink-0" aria-hidden />
                <span>{story.rider_name}</span>
              </span>
            </>
          )}
        </div>

        <h2 className="text-sm sm:text-lg font-bold leading-snug transition-colors group-hover:text-accent">
          {story.title}
        </h2>

        {story.rider_bike && (
          <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-muted">
            <Bike className="size-3 shrink-0 text-muted" aria-hidden />
            <span>{story.rider_bike}</span>
          </p>
        )}

        {story.subtitle && (
          <p className="mt-1.5 sm:mt-2 line-clamp-2 text-[11px] sm:text-sm leading-relaxed text-secondary">
            {story.subtitle}
          </p>
        )}

        {Array.isArray(story.stats) && story.stats.length > 0 && (
          <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1 pt-1 border-t border-border/50">
            {story.stats.slice(0, 3).map((st) => (
              <span
                key={st.label}
                className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-mono text-secondary"
              >
                <span className="text-muted">{st.label}:</span>{" "}
                <strong className="text-accent font-semibold">{st.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
