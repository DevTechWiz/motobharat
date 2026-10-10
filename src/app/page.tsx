import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Container, Section } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/feedback";
import { RideCard } from "@/components/rides/ride-card";
import { PhotoGrid, type GalleryPhoto } from "@/components/rides/photo-grid";
import { formatRideDate, formatRideTime, isPast } from "@/lib/format";
import type { GalleryItem, Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

const PRINCIPLES = [
  {
    num: "01",
    title: "Certified Armor Mandatory",
    desc: "ECE or DOT full-face helmet and CE-rated riding armor required on every mile.",
  },
  {
    num: "02",
    title: "Zero Rash Riding",
    desc: "No street racing, stunts, or reckless overtakes. Safety and teamwork over ego.",
  },
  {
    num: "03",
    title: "Sober Formation",
    desc: "Zero tolerance on alcohol or drugs. Disciplined staggered group column.",
  },
  {
    num: "04",
    title: "Leave No Footprint",
    desc: "Respect for nature, heritage sites, and local villages on every route.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: events }, { count: riderCount }, { count: photoCount }, { data: galleryRows }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("starts_at", { ascending: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("gallery").select("id", { count: "exact", head: true }),
      supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

  const all = (events ?? []) as Ride[];
  const upcoming = all.filter((r) => !isPast(r.starts_at));
  const nextRide = upcoming[0] ?? null;
  const totalKm = all.reduce((sum, r) => sum + (r.distance_km ?? 0), 0);

  const stats = [
    { value: (riderCount ?? 0).toLocaleString("en-IN"), label: "Riders" },
    { value: upcoming.length.toLocaleString("en-IN"), label: "Upcoming Rides" },
    { value: (photoCount ?? 0).toLocaleString("en-IN"), label: "Photos" },
    { value: Math.round(totalKm).toLocaleString("en-IN"), label: "Kilometers" },
  ];

  const memories: GalleryPhoto[] = ((galleryRows ?? []) as GalleryItem[]).map((m) => ({
    url: m.url,
    thumb: m.thumb_url,
    alt: m.alt,
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=2400&q=85"
            alt="Mountain highway winding into the hills at golden hour"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/60" />
          <div
            className="absolute -top-40 -left-32 h-[34rem] w-[46rem] rounded-full bg-accent/12 blur-[130px]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 w-full">
          <Container>
            <div className="max-w-3xl space-y-8 py-20 lg:py-28">
              <div className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-secondary uppercase">
                <span className="inline-block size-1.5 bg-accent" aria-hidden />
                <span className="text-accent">MOTOBHARAT_WARANGAL</span>
                <span className="hidden text-border-strong sm:inline" aria-hidden>
                  ·
                </span>
                <span className="hidden sm:inline">Telangana Touring Chapter</span>
              </div>

              <h1 className="text-4xl leading-[1.04] font-black tracking-tighter text-balance sm:text-6xl lg:text-7xl">
                Different Roads.
                <br />
                <span className="text-accent">One Community.</span>
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-secondary sm:text-xl">
                Warangal&apos;s community of riders — built on road discipline, safety and
                camaraderie. Show up on time, gear up, ride hard, return safe.
              </p>

              {nextRide && (
                <Link
                  href={nextRide.slug ? `/rides/${nextRide.slug}` : `/rides/${nextRide.id}`}
                  className="group flex w-fit max-w-full flex-col gap-1.5 rounded-2xl border border-l-2 border-border border-l-accent bg-surface/60 px-5 py-4 backdrop-blur-md transition-all duration-150 hover:border-border-strong hover:border-l-accent-hover hover:bg-surface-2/80 active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em] text-accent uppercase">
                    Next Departure
                    <ArrowUpRight
                      className="size-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="text-base font-bold sm:text-lg">{nextRide.title}</span>
                  <span className="font-mono text-xs text-secondary tabular-nums">
                    {formatRideDate(nextRide.starts_at)} · {formatRideTime(nextRide.starts_at)}
                  </span>
                </Link>
              )}

              <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center">
                <ButtonLink href="/rides">Find a Ride</ButtonLink>
                <ButtonLink href="/safety" variant="secondary">
                  Our Safety Code
                </ButtonLink>
              </div>

              {/* Instrument-cluster stats strip — live counts (R7) */}
              <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border bg-surface/55 px-4 py-3.5 backdrop-blur-md"
                  >
                    <span className="block font-mono text-2xl font-bold text-white tabular-nums">
                      {s.value}
                    </span>
                    <span className="mt-2 block h-px w-6 bg-accent/70" aria-hidden />
                    <span className="mt-2 block font-mono text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Upcoming rides — live */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Departures"
            title="Upcoming Rides"
            cta={{ href: "/rides", label: "All Rides" }}
          />
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming rides"
              hint="When the community posts rides, they will show up here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.slice(0, 3).map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* About the club — photo essay */}
      <Section bg="surface" border="both">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-[28px] border border-border-strong/50"
                aria-hidden
              />
              <div
                className="absolute -top-3 -left-3 h-10 w-10 border-t-2 border-l-2 border-accent rounded-tl-[28px]"
                aria-hidden
              />
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-bg">
                <Image
                  src="https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80"
                  alt="Misty hairpin curves and ghat roads on a community expedition"
                  fill
                  sizes="(min-width:1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/55 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-white/85 uppercase backdrop-blur-md">
                  Warangal · Telangana
                </span>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-accent" aria-hidden />
                <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
                  About MotoBharat
                </p>
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight sm:text-4xl">
                More than twisting throttles.
              </h2>
              <div className="space-y-4 text-secondary">
                <p>
                  Founded in Warangal, MotoBharat brings together doctors, engineers, students,
                  and explorers. We don&apos;t ask what displacement your machine has or how fast
                  you ride.
                </p>
                <p>
                  We care that you show up on time, ride in protective gear, respect local
                  villagers along rural roads, and return home safely to your family.
                </p>
              </div>
              <Link
                href="/safety"
                className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:text-accent"
              >
                <span>Our Safety Code</span>
                <ArrowRight className="size-3.5 text-accent" aria-hidden />
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Safety principles */}
      <Section border="both">
        <Container>
          <SectionHeader
            eyebrow="Safety Code"
            title="Rules of the Column"
            cta={{ href: "/safety", label: "View Safety Code" }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p) => (
              <div
                key={p.num}
                className="group rounded-xl border border-border bg-surface p-6 transition-colors duration-150 hover:border-accent/40 hover:bg-surface-2"
              >
                <span className="font-mono text-xs font-semibold text-accent">{p.num}</span>
                <span className="mt-3 mb-4 block h-px w-8 bg-border-strong transition-colors duration-150 group-hover:bg-accent/60" aria-hidden />
                <h3 className="text-base font-bold">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-secondary">{p.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Memories teaser — only when gallery photos exist */}
      {memories.length > 0 && (
        <Section bg="surface" border="bottom">
          <Container>
            <SectionHeader
              eyebrow="Visual Archive"
              title="Moments on the Road"
              cta={{ href: "/rides", label: "Rides with Photos" }}
            />
            <PhotoGrid photos={memories} />
          </Container>
        </Section>
      )}

      {/* Join invitation */}
      <Section spacing="spacious">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-16 text-center sm:px-16 lg:py-24">
            <div
              className="absolute -top-48 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]"
              aria-hidden
            />

            <div className="relative space-y-6">
              <div className="flex items-center justify-center gap-2.5 font-mono text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
                <span className="inline-block size-1.5 bg-accent" aria-hidden />
                Membership
                <span className="inline-block size-1.5 bg-accent" aria-hidden />
              </div>
              <h2 className="mx-auto max-w-2xl text-4xl leading-[1.06] font-black tracking-tighter text-balance sm:text-5xl lg:text-6xl">
                Ride with purpose.
              </h2>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
                If you respect the machine, the road and the people riding next to you — you are
                welcome in our column. Google sign-in, one-time rider KYC, no paperwork.
              </p>
              <div className="flex flex-col items-stretch justify-center gap-4 pt-2 sm:flex-row sm:items-center">
                <ButtonLink href="/login">Join with Google</ButtonLink>
                <a
                  href="https://instagram.com/motobharat_warangal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-strong px-6 py-3.5 text-xs font-bold tracking-wider uppercase transition-all duration-150 hover:bg-surface-2 active:scale-[0.97]"
                >
                  <InstagramIcon className="size-4 text-accent" aria-hidden />
                  <span>@motobharat_warangal</span>
                </a>
              </div>
              <p className="pt-2 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                Free to join · 18+ · Warangal, Telangana
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
