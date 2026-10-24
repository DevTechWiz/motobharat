import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Bike,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Award,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { FounderHeroGallery } from "@/components/founders/founder-hero-gallery";
import { FOUNDERS, getFounderBySlug } from "@/lib/founders";

export async function generateStaticParams() {
  return [
    { slug: "vnb" },
    { slug: "akhil" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const founder = getFounderBySlug(slug);
  if (!founder) return { title: "Founder Story Not Found · MotoBharat" };

  return {
    title: `${founder.name} — Founder Story · MotoBharat`,
    description: founder.headline,
  };
}

export default async function FounderStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const founder = getFounderBySlug(slug);

  if (!founder) notFound();

  const otherFounder = FOUNDERS.find((f) => f.slug !== founder.slug);

  return (
    <>
      {/* Top Header / Breadcrumb */}
      <section className="border-b border-border bg-surface/50">
        <Container className="py-4 sm:py-6">
          <nav
            className="flex items-center gap-2 text-xs text-secondary/90"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <Link href="/about" className="transition-colors hover:text-white">
              About Us
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <span className="truncate font-semibold text-accent max-w-[14rem] sm:max-w-none">
              {founder.name}
            </span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-accent uppercase tracking-wider">
              {founder.role}
            </span>
            <span className="text-muted/60">·</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-secondary">
              <Bike className="size-3.5 text-accent shrink-0" />
              <span>{founder.machine}</span>
            </span>
            <span className="text-muted/60">·</span>
            <span className="flex items-center gap-1 font-mono text-xs text-muted">
              <MapPin className="size-3 text-muted" /> Warangal, Telangana
            </span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {founder.name}
          </h1>

          <p className="mt-2.5 text-sm sm:text-base md:text-lg text-secondary max-w-3xl leading-relaxed font-medium">
            {founder.headline}
          </p>
        </Container>
      </section>

      {/* Metrics Strip */}
      <div className="border-b border-border bg-surface">
        <Container>
          <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0 [&>*:nth-child(2)]:border-t-0">
            {founder.stats.map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2.5 sm:gap-3 px-3 py-3 sm:px-6 sm:py-5"
              >
                <Award className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="font-mono text-[9px] sm:text-[10px] tracking-wider text-muted uppercase">
                    {m.label}
                  </p>
                  <p className="truncate text-xs sm:text-sm md:text-base font-bold tabular-nums text-text">
                    {m.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Body Container */}
      <Container className="py-6 sm:py-10 max-w-4xl">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to About Us</span>
          </Link>
        </div>

        {/* 5-Photo Interactive Hero Gallery */}
        <FounderHeroGallery
          photos={founder.expeditionPhotos}
          founderName={founder.name}
          founderRole={founder.role}
        />

        {/* Pull Quote */}
        <blockquote className="my-8 rounded-xl border-l-4 border-accent bg-surface p-4 sm:p-6 text-sm sm:text-base md:text-lg italic text-secondary leading-relaxed font-medium">
          {founder.quote}
        </blockquote>

        {/* Introduction */}
        {founder.intro && founder.intro.length > 0 && (
          <div className="mb-8 space-y-3.5">
            {founder.intro.map((p, idx) => (
              <p key={idx} className="text-sm sm:text-base leading-relaxed text-secondary/90">
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Full Narrative Sections */}
        <article className="space-y-8 sm:space-y-10 text-secondary leading-relaxed">
          {founder.sections.map((sec) => (
            <div key={sec.title} className="space-y-3.5">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent inline-block shrink-0" />
                <span>{sec.title}</span>
              </h2>

              {sec.content.map((p, idx) => (
                <p key={idx} className="text-sm sm:text-base leading-relaxed text-secondary/90">
                  {p}
                </p>
              ))}

              {sec.bullets && sec.bullets.length > 0 && (
                <ul className="space-y-2.5 pl-4 sm:pl-5 list-disc marker:text-accent pt-1">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="text-sm sm:text-base leading-relaxed text-secondary/90">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </article>

        {/* Other Founder Switcher Card */}
        {otherFounder && (
          <div className="mt-12 rounded-2xl border border-border bg-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Co-Founder Story
              </p>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {otherFounder.name}
              </h3>
              <p className="text-xs text-secondary mt-1 line-clamp-1">
                {otherFounder.tagline}
              </p>
            </div>
            <Link
              href={`/about/founders/${otherFounder.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-bold text-accent hover:bg-accent hover:text-black transition-all shrink-0 justify-center"
            >
              <span>Read {otherFounder.name}&apos;s Story</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </Container>
    </>
  );
}
