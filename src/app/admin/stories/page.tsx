import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { StoriesList } from "./stories-list";
import type { Story } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminStoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (data ?? []) as Story[];

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <h2 className="text-base sm:text-lg font-bold">
          All Stories & Achievements{" "}
          <span className="font-mono text-xs sm:text-sm font-semibold text-muted tabular-nums">
            ({list.length})
          </span>
        </h2>
        <ButtonLink href="/admin/stories/new" size="sm">
          <Plus className="size-3.5 sm:size-4" aria-hidden />
          New Story
        </ButtonLink>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No stories yet"
          hint="Publish endurance feats, touring articles, and club milestones — riders see them on the homepage and /stories."
          action={
            <ButtonLink href="/admin/stories/new" variant="outline" size="sm">
              <Plus className="size-4" aria-hidden />
              New Story
            </ButtonLink>
          }
        />
      ) : (
        <StoriesList stories={list} />
      )}
    </div>
  );
}
