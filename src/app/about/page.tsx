import Image from "next/image";
import Link from "next/link";
import {
  Bike,
  ShieldCheck,
  Compass,
  Users,
  Route,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { PageMasthead } from "@/components/layout/page-masthead";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { FOUNDERS } from "@/lib/founders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us · MotoBharat",
  description: "Meet the founders and discover the story behind MotoBharat Warangal.",
};

const CORE_VALUES = [
  {
    title: "Highway Discipline",
    description:
      "We ride in staggered column formation with verified hand signals. Zero tolerance for reckless overtaking, lane splitting, or rash throttle pull.",
    icon: Route,
  },
  {
    title: "All-Gear, Every Mile",
    description:
      "Certified ECE/DOT helmets, armored jackets, riding gloves, and knee guards are mandatory. No gear, no ride — without exception.",
    icon: ShieldCheck,
  },
  {
    title: "18+ & Welcoming All Machines",
    description:
      "From 150cc commuters to 1200cc adventure tourers — whether you're a solo rider or riding two-up with a pillion, you belong here.",
    icon: Users,
  },
];

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  let ctaTitle = "Ready to explore India with us?";
  let ctaDesc =
    "Join Warangal's collective of riders. Sign in with Google, finish your one-time digital KYC, and join our next scheduled ride.";
  let primaryCta = { href: "/login", label: "Join with Google" };
  let secondaryCta: { href: string; label: string } | null = {
    href: "/rides",
    label: "Browse Upcoming Rides",
  };

  if (user) {
    const { data: rd } = await supabase
      .from("rider_details")
      .select("registered, kyc_submitted_at, kyc_rejected")
      .eq("user_id", user.id)
      .maybeSingle();

    if (rd?.registered === true) {
      ctaTitle = "Ready to roll with the pack?";
      ctaDesc =
        "Your rider membership is active and verified. Pick an upcoming departure and ride with the brotherhood.";
      primaryCta = { href: "/rides", label: "Browse Upcoming Rides" };
      secondaryCta = { href: "/profile/card", label: "Your Member Card" };
    } else if (rd?.kyc_submitted_at && !rd?.kyc_rejected) {
      ctaTitle = "Your KYC is Under Review";
      ctaDesc =
        "Your KYC application is submitted. An organiser is reviewing your details. Once approved, you can join any column.";
      primaryCta = { href: "/profile", label: "Check Verification Status" };
      secondaryCta = { href: "/rides", label: "Browse Upcoming Rides" };
    } else {
      ctaTitle = "Finish Your Rider KYC";
      ctaDesc =
        "Complete your one-time digital KYC to unlock joining rides and receive your official digital Member ID card.";
      primaryCta = { href: "/profile/kyc", label: "Complete KYC" };
      secondaryCta = { href: "/rides", label: "Browse Upcoming Rides" };
    }
  }

  return (
    <>
      <PageMasthead
        eyebrow="Our Story & Leadership"
        title="About MotoBharat"
        meta="Warangal · Telangana"
        lede="Warangal's registered collective of riders and explorers — built on road discipline, safety standards, and highway brotherhood."
      />

      {/* Section: The Genesis */}
      <Section spacing="compact">
        <Container size="narrow">
          <Reveal>
            <div className="space-y-4 sm:space-y-6 text-secondary leading-relaxed text-sm sm:text-base">
              <div className="flex items-center gap-2 text-accent">
                <Compass className="size-5" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest">
                  The Genesis
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                Riding together should be safe, organized, and unforgettable.
              </h2>
              <p>
                MotoBharat began in Warangal with a shared vision between two passionate long-distance
                riders: <strong>Rider VNB</strong> and <strong>Akhil Sanchari</strong>. Having
                travelled across the length and breadth of India — from the snow passes of Ladakh and Spiti
                to the rainforests of the Northeast — they noticed that local riding in Warangal often lacked
                convoy discipline, safety protocols, and structured community support.
              </p>
              <p>
                Together, they built MotoBharat as a sanctuary for passionate motorcyclists. A space where
                doctors, engineers, entrepreneurs, and students gear up under a unified banner:{" "}
                <strong className="text-white">
                  strict all-gear rules, staggered highway formations, pre-ride route briefings, and verified
                  emergency contacts (ICE)
                </strong>
                .
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Section: The Founders */}
      <Section bg="surface" border="both">
        <Container>
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              eyebrow="Leadership"
              title="The Founders"
            />

            <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2" gap={0.12}>
              {FOUNDERS.map((founder) => (
                <StaggerItem key={founder.name}>
                  <Link
                    href={`/about/founders/${founder.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_16px_40px_-16px_rgba(245,158,11,0.25)]"
                  >
                    {/* Founder Photo - 100% natural, crisp, zero clipping */}
                    <div className="relative aspect-4/3 sm:aspect-16/10 w-full overflow-hidden rounded-xl border border-border/80 bg-black/90 flex items-center justify-center">
                      {/* Ambient blur backdrop to fill card frame seamlessly */}
                      <Image
                        src={founder.photo}
                        alt=""
                        fill
                        sizes="(min-width:640px) 50vw, 100vw"
                        aria-hidden
                        className="object-cover blur-2xl opacity-25 scale-110 pointer-events-none select-none"
                      />
                      {/* Foreground crisp photo: object-contain prevents all clipping */}
                      <div className="relative size-full p-2 flex items-center justify-center z-10">
                        <Image
                          src={founder.photo}
                          alt={founder.name}
                          fill
                          sizes="(min-width:640px) 50vw, 100vw"
                          className="object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                      {/* Strict Founder badge only */}
                      <span className="absolute top-3 right-3 z-20 rounded-full border border-accent/40 bg-black/80 px-3 py-0.5 font-mono text-[10px] font-bold text-accent uppercase tracking-wider backdrop-blur-md">
                        {founder.role}
                      </span>
                    </div>

                    {/* Minimal Details */}
                    <div className="mt-4 flex flex-1 flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-white transition-colors group-hover:text-accent">
                          {founder.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-accent">
                          <Bike className="size-3.5 shrink-0" />
                          <span className="truncate">{founder.machine}</span>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-secondary line-clamp-2">
                          {founder.shortBio}
                        </p>
                      </div>

                      {/* Clean Call to Action */}
                      <div className="border-t border-border/70 pt-3 flex items-center justify-between text-xs font-bold text-accent">
                        <span>Read Story</span>
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      {/* Section: Core Community Values */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="The Ethos"
            title="What We Stand For"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CORE_VALUES.map((val) => (
              <div
                key={val.title}
                className="rounded-xl border border-border bg-surface p-5 space-y-2.5 transition-all hover:border-accent/40"
              >
                <div className="size-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <val.icon className="size-5" />
                </div>
                <h3 className="text-base font-bold text-white">{val.title}</h3>
                <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Box - Dynamic & Auth-Aware */}
      <Section spacing="compact" bg="surface" border="both">
        <Container size="narrow">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-bg p-6 sm:p-10 text-center">
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-[90px]"
                aria-hidden
              />
              <div className="relative space-y-3 sm:space-y-4">
                <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
                  Community
                </p>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                  {ctaTitle}
                </h2>
                <p className="mx-auto max-w-md text-xs sm:text-sm leading-relaxed text-secondary">
                  {ctaDesc}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <ButtonLink href={primaryCta.href} size="md">
                    {primaryCta.label}
                  </ButtonLink>
                  {secondaryCta && (
                    <ButtonLink href={secondaryCta.href} variant="outline" size="md">
                      {secondaryCta.label}
                    </ButtonLink>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
