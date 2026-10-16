import Link from "next/link";
import { ArrowUpRight, Bike, Megaphone, Users, Plus, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { CountUp } from "@/components/ui/reveal";
import { getStories } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [{ count: rides }, { count: announcements }, { count: members }, stories] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    getStories(),
  ]);

  const cards = [
    { label: "Rides", value: rides ?? 0, href: "/admin/rides", icon: Bike },
    { label: "Stories & Feats", value: stories.length, href: "/admin/stories", icon: Award },
    { label: "Announcements", value: announcements ?? 0, href: "/admin/announcements", icon: Megaphone },
    { label: "Registered Riders", value: members ?? 0, href: "/admin/riders", icon: Users },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const body = (
            <>
              <span className="flex items-center justify-between">
                <c.icon className="size-4 sm:size-5 text-accent" aria-hidden />
                {c.href && (
                  <ArrowUpRight
                    className="size-3.5 sm:size-4 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                )}
              </span>
              <p className="mt-2.5 sm:mt-4 font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
                <CountUp to={c.value} />
              </p>
              <span className="mt-1.5 sm:mt-2 block h-px w-5 sm:w-6 bg-accent/70" aria-hidden />
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-secondary">{c.label}</p>
            </>
          );
          const cls =
            "group rounded-xl border border-border bg-surface p-3.5 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-2 hover:shadow-[0_20px_50px_-24px_rgba(245,158,11,0.45)]";
          return c.href ? (
            <Link key={c.label} href={c.href} className={cls}>
              {body}
            </Link>
          ) : (
            <div key={c.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
        <ButtonLink href="/admin/rides/new" className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden />
          New Ride
        </ButtonLink>
        <ButtonLink href="/admin/stories/new" variant="secondary" className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden />
          New Story
        </ButtonLink>
        <ButtonLink href="/admin/announcements/new" variant="secondary" className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden />
          New Announcement
        </ButtonLink>
      </div>
    </div>
  );
}
