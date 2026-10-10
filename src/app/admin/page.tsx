import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [{ count: rides }, { count: announcements }, { count: members }] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    { label: "Rides", value: rides ?? 0, href: "/admin/rides" },
    { label: "Announcements", value: announcements ?? 0, href: "/admin/announcements" },
    { label: "Registered Riders", value: members ?? 0, href: "/admin" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border bg-surface p-6 transition-colors hover:bg-surface-2"
          >
            <p className="font-mono text-3xl font-bold text-accent tabular-nums">{c.value}</p>
            <p className="mt-1 text-sm text-secondary">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/rides/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-accent-hover"
        >
          + New Ride
        </Link>
        <Link
          href="/admin/announcements/new"
          className="rounded-lg border border-border-strong bg-surface px-5 py-2.5 text-sm font-bold transition-colors hover:bg-surface-2"
        >
          + New Announcement
        </Link>
      </div>
    </div>
  );
}
