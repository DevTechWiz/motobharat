import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { AnnouncementsList } from "./announcements-list";
import type { Announcement } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (data ?? []) as Announcement[];

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <h2 className="text-base sm:text-lg font-bold">
          All Announcements{" "}
          <span className="font-mono text-xs sm:text-sm font-semibold text-muted tabular-nums">
            ({list.length})
          </span>
        </h2>
        <ButtonLink href="/admin/announcements/new" size="sm">
          <Plus className="size-3.5 sm:size-4" aria-hidden />
          New Announcement
        </ButtonLink>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          hint="Post rain updates, meetups, or workshops — riders see them instantly."
          action={
            <ButtonLink href="/admin/announcements/new" variant="outline" size="sm">
              <Plus className="size-4" aria-hidden />
              New Announcement
            </ButtonLink>
          }
        />
      ) : (
        <AnnouncementsList items={list} />
      )}
    </div>
  );
}
