import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Container, Section } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/feedback";
import { RideCard } from "@/components/rides/ride-card";
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/ui/reveal";
import { Marquee } from "@/components/ui/marquee";
import { PhotoGrid, type GalleryPhoto } from "@/components/rides/photo-grid";
import { formatRideDate, formatRideTime, isPast } from "@/lib/format";
import type { GalleryItem, Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    { value: riderCount ?? 0, label: "Riders" },
    { value: upcoming.length, label: "Upcoming Rides" },
    { value: photoCount ?? 0, label: "Photos" },
    { value: Math.round(totalKm), label: "Kilometers" },
  ];

  const memories: GalleryPhoto[] = ((galleryRows ?? []) as GalleryItem[]).map((m) => ({
    url: m.url,
    thumb: m.thumb_url,
    alt: m.alt,
  }));

  return (
    <>
      {/* Hero */}
      <section className="grain relative flex min-h-[86vh] items-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=2400&q=85"
            alt="Mountain highway winding into the hills at golden hour"
            fill
            sizes="100vw"
            priority
            className="animate-ken-burns object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/60" />
          <div
            className="animate-bloom absolute -top-40 -left-32 h-[34rem] w-[46rem] rounded-full bg-accent/12 blur-[130px]"
            aria-hidden
          />
          <div
            className="absolute -right-40 -bottom-40 h-[28rem] w-[36rem] rounded-full bg-orange/8 blur-[130px]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 w-full">
          <Container>
            <div className="max-w-3xl space-y-6 py-14 lg:py-20">
              <div className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-secondary uppercase">
                <span className="inline-block size-1.5 bg-accent" aria-hidden />
                <span className="text-accent">MOTOBHARAT_WARANGAL</span>
                <span className="hidden text-border-strong sm:inline" aria-hidden>
                  ·
                </span>
                <span className="hidden sm:inline">Telangana Touring Chapter</span>
              </div>

              <h1 className="text-4xl leading-[1.04] font-black tracking-tighter text-balance sm:text-6xl lg:text-7xl">
                <span className="animate-fade-in-up block" style={{ animationDelay: "0.1s" }}>
                  Different Roads.
                </span>
                <span
                  className="animate-fade-in-up block text-accent drop-shadow-[0_0_30px_rgba(245,158,11,0.35)]"
                  style={{ animationDelay: "0.25s" }}
                >
                  One Community.
                </span>
              </h1>

              <p
                className="animate-fade-in-up max-w-2xl text-base leading-relaxed text-secondary sm:text-xl"
                style={{ animationDelay: "0.4s" }}
              >
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
                    className="rounded-xl border border-border bg-surface/55 px-4 py-3.5 backdrop-blur-md transition-colors duration-200 hover:border-accent/40 hover:bg-surface-2/70"
                  >
                    <span className="block font-mono text-2xl font-bold text-white tabular-nums">
                      <CountUp to={s.value} />
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

      {/* Ethos marquee ribbon */}
      <div className="border-b border-border bg-surface/40 py-4">
        <Marquee
          items={[
            "Ride with discipline",
            "Full gear mandatory",
            "Warangal · Telangana",
            "Different roads · One community",
            "Return safe",
          ]}
        />
      </div>

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
          <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="group relative">
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
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
          </Reveal>
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
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.1}>
            {PRINCIPLES.map((p) => (
              <StaggerItem key={p.num}>
                <div className="group h-full rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface-2 hover:shadow-[0_16px_40px_-16px_rgba(245,158,11,0.35)]">
                  <span className="font-mono text-xs font-semibold text-accent">{p.num}</span>
                  <span className="mt-3 mb-4 block h-px w-8 bg-border-strong transition-colors duration-150 group-hover:bg-accent/60" aria-hidden />
                  <h3 className="text-base font-bold">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-secondary">{p.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
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
          <Reveal>
          <div className="grain relative overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="grid lg:grid-cols-2">
              <div className="group relative min-h-72 overflow-hidden lg:min-h-full">
                <Image
                  src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1600&q=80"
                  alt="Rider on an open highway at dusk"
                  fill
                  sizes="(min-width:1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-surface/40" aria-hidden />
                <span className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/55 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-white/85 uppercase backdrop-blur-md">
                  Different Roads · One Community
                </span>
              </div>

              <div className="relative space-y-6 p-8 sm:p-12">
                <div
                  className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-[100px]"
                  aria-hidden
                />
                <div className="relative space-y-6">
                  <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
                    <span className="inline-block size-1.5 bg-accent" aria-hidden />
                    Membership
                  </div>
                  <h2 className="text-4xl leading-[1.06] font-black tracking-tighter text-balance sm:text-5xl">
                    Ride with <span className="text-shimmer">purpose.</span>
                  </h2>
                  <ol className="space-y-4">
                    {[
                      { num: "01", title: "Sign in with Google", desc: "One tap — no passwords, no forms to start." },
                      { num: "02", title: "Complete rider KYC once", desc: "Bike, licence and the safety waiver." },
                      { num: "03", title: "Join a ride", desc: "Pick a departure, show up geared up." },
                    ].map((s) => (
                      <li key={s.num} className="flex items-start gap-4">
                        <span className="font-mono text-xs font-bold text-accent">{s.num}</span>
                        <span className="mt-0 h-px w-6 shrink-0 translate-y-2 bg-border-strong" aria-hidden />
                        <span>
                          <span className="block text-sm font-bold">{s.title}</span>
                          <span className="mt-0.5 block text-xs text-secondary">{s.desc}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="pt-2">
                    <ButtonLink href="/login">Join with Google</ButtonLink>
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                    Free to join · 18+ · Warangal, Telangana
                  </p>
                </div>
              </div>
            </div>
          </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
