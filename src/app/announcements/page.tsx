import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { PageMasthead } from "@/components/layout/page-masthead";
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
      <PageMasthead
        eyebrow="Updates"
        title="Announcements"
        meta={
          items.length > 0
            ? `${items.length} ${items.length === 1 ? "notice" : "notices"} posted`
            : undefined
        }
        lede="Community notices, ride updates, and safety bulletins."
      />

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
                  className="group rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-2 hover:shadow-[0_20px_50px_-24px_rgba(245,158,11,0.45)]"
                >
                  <div className="flex items-start gap-5">
                    <div className="self-start flex flex-col items-center justify-center rounded-xl border border-border bg-surface-2/90 px-3.5 py-2.5 min-w-[4.25rem] text-center shrink-0 select-none">
                      <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider">
                        {new Date(a.created_at).toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })}
                      </span>
                      <span className="font-mono text-xl font-black text-text leading-tight my-0.5">
                        {new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" })}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {new Date(a.created_at).toLocaleDateString("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" })}
                      </span>
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
