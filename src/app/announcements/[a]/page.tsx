import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
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
  return { title: announcement.title };
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ a: string }>;
}) {
  const { a } = await params;
  const announcement = await getAnnouncement(a);
  if (!announcement) notFound();

  const more = await getMoreNotices(announcement.id);

  return (
    <>
      <Section spacing="compact">
        <Container className="max-w-3xl">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-secondary uppercase transition-colors hover:text-accent"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All Announcements
          </Link>

          <p className="mt-8 inline-block rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[11px] tracking-wider text-muted uppercase tabular-nums">
            {formatDate(announcement.created_at)}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{announcement.title}</h1>

          <div className="mt-6 h-px bg-border" aria-hidden />

          <article className="mt-6 space-y-4 whitespace-pre-wrap text-[17px] leading-relaxed text-secondary">
            {announcement.body}
          </article>
        </Container>
      </Section>

      {more.length > 0 && (
        <Section bg="surface" border="top">
          <Container className="max-w-3xl">
            <p className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
              More Notices
            </p>
            <div className="mt-5 space-y-3">
              {more.map((m) => (
                <Link
                  key={m.id}
                  href={m.slug ? `/announcements/${m.slug}` : `/announcements/${m.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-bg px-5 py-4 transition-colors hover:border-accent/40"
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
