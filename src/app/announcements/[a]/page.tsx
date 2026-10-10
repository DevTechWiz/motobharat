import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  return (
    <Section spacing="compact">
      <Container className="max-w-3xl">
        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-secondary uppercase transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All Announcements
        </Link>
        <p className="mt-8 font-mono text-[11px] text-muted">{formatDate(announcement.created_at)}</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{announcement.title}</h1>
        <article className="mt-6 whitespace-pre-wrap leading-relaxed text-secondary">
          {announcement.body}
        </article>
      </Container>
    </Section>
  );
}
