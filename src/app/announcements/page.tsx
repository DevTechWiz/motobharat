import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/feedback";
import type { Announcement } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as Announcement[];

  return (
    <>
      <Section spacing="compact" border="bottom">
        <Container>
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Updates</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">Announcements</h1>
          <p className="mt-3 max-w-2xl text-secondary">
            Community notices, ride updates, and safety bulletins.
          </p>
          {items.length > 0 && (
            <p className="mt-5 font-mono text-[11px] tracking-wider text-muted uppercase tabular-nums">
              {items.length} {items.length === 1 ? "notice" : "notices"} posted
            </p>
          )}
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          {items.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              hint="When the community posts updates, they will show up here."
            />
          ) : (
            <div className="space-y-4">
              {items.map((a) => (
                <article
                  key={a.id}
                  className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40 hover:bg-surface-2"
                >
                  <div className="flex gap-5">
                    <div className="w-fit shrink-0 rounded-lg border border-border bg-bg px-3 py-2 font-mono text-[11px] leading-relaxed tracking-wider text-muted uppercase tabular-nums">
                      {formatDate(a.created_at)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-bold">
                          {a.slug ? (
                            <Link
                              href={`/announcements/${a.slug}`}
                              className="transition-colors hover:text-accent"
                            >
                              {a.title}
                            </Link>
                          ) : (
                            a.title
                          )}
                        </h2>
                        {a.slug && (
                          <ArrowUpRight
                            className="mt-1 size-4 shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        )}
                      </div>
                      {a.body && (
                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap leading-relaxed text-secondary">
                          {a.body}
                        </p>
                      )}
                      {a.slug && (
                        <Link
                          href={`/announcements/${a.slug}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:text-accent"
                        >
                          Read notice
                          <ArrowUpRight className="size-3.5 text-accent" aria-hidden />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
