import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">All Announcements ({list.length})</h2>
        <Link
          href="/admin/announcements/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-bg hover:bg-accent-hover"
        >
          + New Announcement
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted">No announcements yet.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-muted">{formatDate(a.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {a.slug && (
                  <Link
                    href={`/announcements/${a.slug}`}
                    className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-surface-2"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/admin/announcements/${a.id}/edit`}
                  className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-surface-2"
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
