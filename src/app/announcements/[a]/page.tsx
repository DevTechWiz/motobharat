import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { AdminEditLink } from "@/components/layout/admin-edit-link";
import { formatDate } from "@/lib/format";
import type { Announcement } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getAnnouncement(param: string) {
  const supabase = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .or(isUuid ? `id.eq.${param},slug.eq.${param}` : `slug.eq.${param}`)
    .maybeSingle();
  return (data as unknown as Announcement) ?? null;
}

async function getMoreNotices(currentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(3);
  return (data ?? []) as Announcement[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ a: string }>;
}) {
  const { a } = await params;
  const announcement = await getAnnouncement(a);
  if (!announcement) return { title: "Announcement not found" };
  return {
    title: announcement.title,
    description: announcement.body
      ? announcement.body.slice(0, 155).trim()
      : "Community notice from MotoBharat Warangal.",
  };
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ a: string }>;
}) {
  const { a } = await params;
  const announcement = await getAnnouncement(a);
  if (!announcement) notFound();

  // Server-side role check for the admin edit shortcut (display only —
  // /admin enforces proxy + requireAdmin + RLS independently).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: self } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = self?.role === "admin";
  }

  const more = await getMoreNotices(announcement.id);

  return (
    <>
      <Section spacing="compact">
        <Container className="max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/announcements"
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-secondary uppercase transition-colors hover:text-accent"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All Announcements
            </Link>
            {isAdmin && (
              <AdminEditLink href={`/admin/announcements/${announcement.id}/edit`} label="Edit" />
            )}
          </div>

          <p className="mt-5 sm:mt-8 inline-block rounded-lg border border-border bg-surface px-2.5 sm:px-3 py-1 sm:py-1.5 font-mono text-[10px] sm:text-[11px] tracking-wider text-muted uppercase tabular-nums">
            {formatDate(announcement.created_at)}
          </p>
          <h1 className="mt-2.5 sm:mt-4 text-2xl font-extrabold sm:text-4xl tracking-tight leading-tight">{announcement.title}</h1>

          <div className="mt-4 sm:mt-6 h-px bg-border" aria-hidden />

          <article className="mt-4 sm:mt-6 space-y-4 whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-secondary">
            {announcement.body}
          </article>
        </Container>
      </Section>

      {more.length > 0 && (
        <Section bg="surface" border="top">
          <Container className="max-w-3xl">
            <p className="text-[11px] sm:text-sm font-bold tracking-[0.18em] text-accent uppercase">
              More Notices
            </p>
            <div className="mt-3.5 sm:mt-5 space-y-2.5 sm:space-y-3">
              {more.map((m) => (
                <Link
                  key={m.id}
                  href={m.slug ? `/announcements/${m.slug}` : `/announcements/${m.id}`}
                  className="group flex items-center justify-between gap-3 sm:gap-4 rounded-xl border border-border bg-bg px-3.5 sm:px-5 py-3 sm:py-4 transition-colors hover:border-accent/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold transition-colors group-hover:text-accent">
                      {m.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] tracking-wider text-muted uppercase tabular-nums">
                      {formatDate(m.created_at)}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-accent transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
