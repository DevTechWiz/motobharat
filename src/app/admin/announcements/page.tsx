import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/format";
import { DeleteAnnouncementButton } from "./delete-announcement-button";
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          All Announcements{" "}
          <span className="font-mono text-sm font-semibold text-muted tabular-nums">
            ({list.length})
          </span>
        </h2>
        <ButtonLink href="/admin/announcements/new" size="sm">
          <Plus className="size-4" aria-hidden />
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
        <ul className="space-y-2">
          {list.map((a) => (
            <li
              key={a.id}
              className="relative flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 hover:border-accent/40 hover:bg-surface-2"
            >
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  <Link
                    href={`/admin/announcements/${a.id}/edit`}
                    className="transition-colors after:absolute after:inset-0 hover:text-accent focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent focus-visible:after:ring-inset focus-visible:after:rounded-xl"
                  >
                    {a.title}
                  </Link>
                </p>
                <p className="text-xs text-muted">{formatDate(a.created_at)}</p>
              </div>
              <div className="relative flex items-center gap-2">
                <Link
                  href={`/admin/announcements/${a.id}/edit`}
                  className="rounded-lg border border-border-strong px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-surface-2"
                >
                  Edit
                </Link>
                <DeleteAnnouncementButton id={a.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
