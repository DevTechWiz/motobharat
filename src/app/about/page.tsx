import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  IdCard,
  Images,
  Megaphone,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Container, Section } from "@/components/layout/container";
import { PageMasthead } from "@/components/layout/page-masthead";
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/ui/reveal";
import { isPast } from "@/lib/format";
import type { Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "About Us" };

const MEMBERSHIP_STEPS = [
  {
    num: "01",
    title: "Sign in with Google",
    body: "One tap creates your rider profile — no passwords, no forms to start.",
    href: "/login",
    cta: "Sign in",
  },
  {
    num: "02",
    title: "Tell us who you are",
    body: "Name, age (18+), city and contact details. Two minutes, once.",
    href: "/profile/setup",
    cta: "Basic info",
  },
  {
    num: "03",
    title: "File your rider KYC",
    body: "Bike, licence number with a photo of the licence, emergency contacts and the safety waiver.",
    href: "/profile/kyc",
    cta: "Rider KYC",
  },
  {
    num: "04",
    title: "Admin review",
    body: "An organiser cross-checks your photo, licence and name. Approval unlocks joining and your ID card.",
    href: "/profile",
    cta: "Check status",
  },
  {
    num: "05",
    title: "Join the column",
    body: "Pick a departure, show up on time and geared up. Leave any ride, anytime.",
    href: "/rides",
    cta: "Browse rides",
  },
];

const RIDE_FACTS = [
  {
    icon: Calendar,
    title: "Organised departures",
    body: "Organisers plan every ride — route, assembly point, distance and difficulty — then publish it for everyone.",
  },
  {
    icon: Route,
    title: "Upcoming, completed, cancelled",
    body: "Rides live in three tabs so you always know what is rolling, what rolled, and what was called off.",
  },
  {
    icon: Users,
    title: "Join and leave freely",
    body: "Approved members join with one tap and appear in Who's Riding. Plans change? Leave just as easily.",
  },
  {
    icon: Images,
    title: "Every ride keeps photos",
    body: "Galleries and organiser announcements stay attached to the ride, so memories and updates never scatter.",
  },
];

const GOOD_TO_KNOW = [
  {
    lead: "Free forever.",
    rest: "No fees, no tiers, no paid anything at this stage — joining and riding cost nothing.",
  },
  {
    lead: "18+ only.",
    rest: "Registration needs a valid date of birth showing 18 years or more.",
  },
  {
    lead: "Browsing is open, joining is gated.",
    rest: "Anyone can explore rides, photos and notices. Joining a column needs approved KYC.",
  },
  {
    lead: "Full gear is mandatory.",
    rest: "Helmet, gloves and riding discipline on every mile — the Safety Code is non-negotiable.",
  },
  {
    lead: "All times are IST.",
    rest: "Departure and assembly times are shown in Indian Standard Time.",
  },
];

const PILLARS = [
  {
    icon: Route,
    title: "Curated Rides",
    body: "Admins plan every departure — route, assembly point, distance. Riders browse and join.",
    href: "/rides",
    cta: "Browse rides",
  },
  {
    icon: ShieldCheck,
    title: "One-Time KYC",
    body: "Bike, licence and the safety waiver, reviewed by an admin. Approval unlocks joining.",
    href: "/profile/kyc",
    cta: "Complete KYC",
  },
  {
    icon: Images,
    title: "Ride Memories",
    body: "Every ride keeps its photo gallery — the community's visual archive of the road.",
    href: "/rides",
    cta: "See galleries",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    body: "Rain cancellations, meetups, workshops — official notices from the organisers.",
    href: "/announcements",
    cta: "Read notices",
  },
  {
    icon: ShieldCheck,
    title: "Safety First",
    body: "A non-negotiable riding code every member agrees to before joining a column.",
    href: "/safety",
    cta: "Safety code",
  },
  {
    icon: IdCard,
    title: "Member ID Card",
    body: "Registered riders get a digital ID with a QR sponsors can verify on the spot.",
    href: "/profile/card",
    cta: "Your card",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();

  const [
    { data: events },
    { count: riderCount },
    { count: photoCount },
    { data: authData },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("starts_at", { ascending: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("gallery").select("id", { count: "exact", head: true }),
    supabase.auth.getUser(),
  ]);

  const all = (events ?? []) as Ride[];
  const upcoming = all.filter((r) => !isPast(r.starts_at));
  const totalKm = all.reduce((sum, r) => sum + (r.distance_km ?? 0), 0);

  const stats: { value: number; label: string; icon: typeof Users }[] = [
    { value: riderCount ?? 0, label: "Riders", icon: Users },
    { value: all.length, label: "Rides", icon: Route },
    { value: photoCount ?? 0, label: "Photos", icon: Images },
    { value: Math.round(totalKm), label: "KM Together", icon: Route },
  ];

  const user = authData?.user ?? null;
  let joinCta = { href: "/login", label: "Join with Google" };
  if (user) {
    const { data: rd } = await supabase
      .from("rider_details")
      .select("registered")
      .eq("user_id", user.id)
      .maybeSingle();
    joinCta =
      rd?.registered === true
        ? { href: "/rides", label: "Browse Rides" }
        : { href: "/profile/kyc", label: "Complete your KYC" };
  }

  const steps = MEMBERSHIP_STEPS.map((s) => {
    if (s.num === "01" && user) {
      return {
        ...s,
        title: "Signed in with Google",
        body: "Your rider account is authenticated and active.",
        href: "/profile",
        cta: "Account active",
      };
    }
    return s;
  });

  return (
    <>
      <PageMasthead
        eyebrow="Our Story"
        title="About MotoBharat"
        meta="Warangal · Telangana"
        lede="Warangal's community of riders — built on road discipline, safety and camaraderie."
      />

      {/* Banner */}
      <Container className="pt-4 sm:pt-8">
        <Reveal>
          <div className="group relative aspect-16/10 overflow-hidden rounded-2xl border border-border bg-surface-2 sm:aspect-21/9">
            <Image
              src="https://assets.motobharat.co/hero/aboutUs_01.jpeg"
              alt="MotoBharat riders assembled for a community expedition"
              fill
              sizes="100vw"
              priority
              fetchPriority="high"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
              aria-hidden
            />
            <span className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.16em] sm:tracking-[0.18em] text-white/85 uppercase backdrop-blur-md">
              Different Roads · One Community
            </span>
          </div>
        </Reveal>
      </Container>

      {/* Who we are */}
      <Section spacing="compact">
        <Container size="narrow">
          <Reveal>
            <p className="text-xs leading-relaxed text-secondary sm:text-base">
              MotoBharat brings together doctors, engineers, students and explorers who
              share one rule: show up on time, gear up, respect the road and the villages
              it passes through, and return home safe. Organisers plan every departure —
              members bring the discipline. New here? This page explains how the club runs.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Live stats band */}
      <Section bg="surface" border="both" spacing="compact">
        <Container>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 sm:gap-3.5">
                <s.icon className="size-5 sm:size-7 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
                <span>
                  <span className="block font-mono text-lg leading-none font-bold text-white tabular-nums sm:text-2xl">
                    <CountUp to={s.value} />
                  </span>
                  <span className="mt-1 block text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] sm:tracking-[0.14em] text-muted uppercase">
                    {s.label}
                  </span>
                </span>
              </div>
            ))}
          </div>
          {upcoming.length > 0 && (
            <p className="mt-4 sm:mt-6 font-mono text-[10px] sm:text-[11px] tracking-wider text-muted uppercase tabular-nums">
              {upcoming.length} upcoming {upcoming.length === 1 ? "ride" : "rides"} —{" "}
              <Link href="/rides" className="text-accent hover:underline">
                join the next departure
              </Link>
            </p>
          )}
        </Container>
      </Section>

      {/* How membership works */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Joining"
            title="How Membership Works"
            cta={joinCta}
          />
          <Stagger className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5" gap={0.08}>
            {steps.map((s) => (
              <StaggerItem key={s.num}>
                <Link
                  href={s.href}
                  className="group flex h-full flex-col rounded-xl border border-border bg-surface p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface-2 active:scale-[0.97]"
                >
                  <span className="font-mono text-xs font-bold text-accent">{s.num}</span>
                  <span className="mt-2 mb-3 block h-px w-8 bg-border-strong transition-colors duration-150 group-hover:bg-accent/60" aria-hidden />
                  <h3 className="text-sm font-bold transition-colors group-hover:text-accent">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-secondary">{s.body}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-secondary transition-colors group-hover:text-accent">
                    {s.cta}
                    <ArrowRight className="size-3 text-accent transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* How rides work */}
      <Section bg="surface" border="both">
        <Container>
          <SectionHeader
            eyebrow="Riding"
            title="How Rides Work"
            cta={{ href: "/rides", label: "All Rides" }}
          />
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
            {RIDE_FACTS.map((f) => (
              <div
                key={f.title}
                className="flex gap-3 sm:gap-4 rounded-xl border border-border bg-bg p-3.5 sm:p-5 transition-colors duration-200 hover:border-accent/40"
              >
                <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <f.icon className="size-4.5 sm:size-5 text-accent" aria-hidden />
                </span>
                <span>
                  <h3 className="text-sm font-bold">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-secondary">{f.body}</p>
                </span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Photo strip */}
      <Container>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            {
              src: "https://assets.motobharat.co/hero/IMG_9456_11zon.jpg",
              alt: "MotoBharat riders on the open road",
            },
            {
              src: "https://assets.motobharat.co/hero/aboutUs_04.jpg",
              alt: "Community riding column in formation",
            },
            {
              src: "https://assets.motobharat.co/hero/aboutUs_03.jpeg",
              alt: "Riders gathered at the departure assembly point",
            },
          ].map((p) => (
            <div
              key={p.src}
              className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface-2 sm:aspect-16/10"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width:1024px) 33vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </Container>

      {/* What we do */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="The Club"
            title="What We Do"
            cta={{ href: "/rides", label: "See It Live" }}
          />
          <Stagger className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.1}>
            {PILLARS.map((p) => (
              <StaggerItem key={p.title}>
                <Link
                  href={p.href}
                  className="group flex h-full flex-col rounded-xl border border-border bg-surface p-4 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface-2 hover:shadow-[0_16px_40px_-16px_rgba(245,158,11,0.35)] active:scale-[0.97]"
                >
                  <span className="flex size-9 sm:size-10 items-center justify-center rounded-lg bg-accent/10 transition-colors duration-200 group-hover:bg-accent/20">
                    <p.icon className="size-4.5 sm:size-5 text-accent" aria-hidden />
                  </span>
                  <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-bold transition-colors group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 flex-1 text-xs leading-relaxed text-secondary">{p.body}</p>
                  <span className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-secondary transition-colors group-hover:text-accent">
                    {p.cta}
                    <ArrowRight className="size-3.5 text-accent transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* Good to know */}
      <Section bg="surface" border="both">
        <Container size="narrow">
          <SectionHeader eyebrow="Before you ask" title="Good to Know" />
          <ul className="divide-y divide-border rounded-xl border border-border bg-bg">
            {GOOD_TO_KNOW.map((g) => (
              <li key={g.lead} className="flex items-start gap-2.5 sm:gap-3 px-3.5 py-3 sm:px-5 sm:py-4">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/12">
                  <Check className="size-3 text-accent" aria-hidden />
                </span>
                <p className="text-xs leading-relaxed text-secondary sm:text-sm">
                  <strong className="font-bold text-white">{g.lead}</strong> {g.rest}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 sm:mt-4 text-center text-xs text-muted">
            The full riding rules live in our{" "}
            <Link href="/safety" className="font-semibold text-accent hover:underline">
              Safety Code
            </Link>
            .
          </p>
        </Container>
      </Section>

      {/* Join CTA */}
      <Section spacing="compact">
        <Container size="narrow">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-10 text-center">
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-[90px]"
                aria-hidden
              />
              <div className="relative space-y-3 sm:space-y-4">
                <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
                  Membership
                </p>
                <h2 className="text-xl sm:text-4xl font-black tracking-tight text-balance">
                  Ready to ride with us?
                </h2>
                <p className="mx-auto max-w-md text-xs leading-relaxed text-secondary sm:text-sm">
                  Sign in, finish your one-time KYC, and pick a departure. Free to join · 18+ ·
                  Warangal, Telangana.
                </p>
                <div className="pt-1">
                  <ButtonLink
                    href={joinCta.href}
                    className="!min-h-[38px] sm:!min-h-[44px] px-4 sm:px-6 py-2 sm:py-3.5 text-xs font-bold"
                  >
                    {joinCta.label}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
