import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Award, User, Bike, ShieldCheck, Sparkles } from "lucide-react";
import { Container, Section } from "@/components/layout/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AdminEditLink } from "@/components/layout/admin-edit-link";
import { ZoomableImage } from "@/components/ui/image-lightbox";
import { PhotoGrid, type GalleryPhoto } from "@/components/rides/photo-grid";
import { StoryCard } from "@/components/stories/story-card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { getStoryBySlug, getStories } from "@/lib/stories";
import type { StoryCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "Story Not Found · MotoBharat" };

  return {
    title: `${story.title} · MotoBharat Warangal`,
    description: story.subtitle || "Rider stories and achievements from MotoBharat Warangal.",
    openGraph: {
      title: story.title,
      description: story.subtitle || undefined,
      images: story.cover_url ? [story.cover_url] : undefined,
    },
  };
}

const CATEGORY_META: Record<
  StoryCategory,
  { label: string; tone: "easy" | "moderate" | "hard" | "neutral" }
> = {
  achievement: { label: "Achievement", tone: "moderate" },
  tour_story: { label: "Tour Story", tone: "easy" },
  milestone: { label: "Milestone", tone: "hard" },
  spotlight: { label: "Spotlight", tone: "neutral" },
};

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  // Admin edit shortcut check (same pattern as /rides/[ride] and /announcements/[a])
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: self } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = self?.role === "admin";
  }

  const allStories = await getStories();
  const moreStories = allStories
    .filter((s) => s.id !== story.id && s.slug !== story.slug)
    .slice(0, 3);

  const categoryConfig = CATEGORY_META[story.category] ?? CATEGORY_META.achievement;

  const galleryPhotos: GalleryPhoto[] = (story.photos ?? [])
    .filter((p) => p && typeof p.url === "string" && p.url.trim().length > 0)
    .map((p, idx) => ({
      url: p.url,
      thumb: p.thumb || p.url,
      alt: p.caption || `${story.title} photo ${idx + 1}`,
    }));

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-bold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em class='text-white/90 italic'>$1</em>");
  };

  const isHeading = (trimmed: string): boolean => {
    if (trimmed.startsWith("#")) {
      return true;
    }
    // Generic check for clean standalone section headers
    if (trimmed.length > 0 && trimmed.length <= 70 && !trimmed.includes("\n")) {
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith(">")) {
        return false;
      }
      if (!trimmed.endsWith(".") && !trimmed.endsWith(",") && !trimmed.endsWith(";") && !trimmed.endsWith("?")) {
        return true;
      }
    }
    return false;
  };

  const isPullQuote = (trimmed: string): boolean => {
    if (trimmed.startsWith(">")) return true;
    const isQuoted =
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('“') && trimmed.endsWith('”'));
    return isQuoted && trimmed.length < 180;
  };

  const isSignoff = (trimmed: string): boolean => {
    return (
      trimmed.startsWith("—") ||
      trimmed.startsWith("–") ||
      trimmed.startsWith("--") ||
      trimmed.toLowerCase().startsWith("- team") ||
      trimmed.toLowerCase().startsWith("team motobharat") ||
      trimmed.toLowerCase().startsWith("team moto bharat")
    );
  };

  const renderContent = (content: string) => {
    // Normalize Windows CRLF and multi-line breaks
    const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rawBlocks = normalized
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

    // Filter out title duplication if the first block repeats the story title
    const isTitleMatch = (str: string) => {
      const s1 = str.toLowerCase().replace(/[^a-z0-9]/g, "");
      const s2 = story.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      return s1.length > 10 && (s1 === s2 || s1.startsWith(s2) || s2.startsWith(s1));
    };
    const blocks =
      rawBlocks.length > 0 && isTitleMatch(rawBlocks[0])
        ? rawBlocks.slice(1)
        : rawBlocks;

    return blocks.map((block, idx) => {
      const trimmed = block;

      // Section Headings
      if (isHeading(trimmed)) {
        const headingText = trimmed.replace(/^#+\s*/, "");
        return (
          <h2
            key={idx}
            className="pt-6 sm:pt-8 first:pt-0 text-lg sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5"
          >
            <span className="size-2 rounded-full bg-accent inline-block shrink-0" aria-hidden />
            <span>{headingText}</span>
          </h2>
        );
      }

      // Punchy pull quotes / mantras
      if (isPullQuote(trimmed)) {
        return (
          <blockquote
            key={idx}
            className="my-6 rounded-xl border border-accent/40 bg-surface-2/90 px-6 py-4 text-center font-bold text-sm sm:text-base text-accent tracking-wide shadow-sm"
          >
            “{trimmed.replace(/^["“]|["”]$/g, "")}”
          </blockquote>
        );
      }

      // Editorial Signoff
      if (isSignoff(trimmed)) {
        const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
        return (
          <div
            key={idx}
            className="mt-8 rounded-xl border border-border/80 bg-surface-2/60 p-5 sm:p-6 backdrop-blur space-y-1.5"
          >
            <p className="font-bold text-sm sm:text-base text-white tracking-wide">
              {lines[0]}
            </p>
            {lines.slice(1).map((sub, sIdx) => (
              <p key={sIdx} className="text-xs sm:text-sm text-secondary">
                {sub}
              </p>
            ))}
          </div>
        );
      }

      // Bullet lists
      const lines = trimmed.split("\n");
      const bulletLines = lines.filter((l) => l.trim().startsWith("- "));
      if (bulletLines.length > 0 && bulletLines.length === lines.length) {
        return (
          <ul
            key={idx}
            className="space-y-2.5 pl-5 text-sm sm:text-base md:text-[17px] leading-relaxed text-secondary/90 list-disc marker:text-accent"
          >
            {bulletLines.map((line, itemIdx) => (
              <li
                key={itemIdx}
                dangerouslySetInnerHTML={{
                  __html: formatInline(line.trim().replace(/^-\s+/, "")),
                }}
              />
            ))}
          </ul>
        );
      }

      // First narrative paragraph gets elegant lead hook treatment
      if (idx === 0) {
        return (
          <p
            key={idx}
            className="text-base sm:text-lg md:text-xl font-medium text-white/95 leading-relaxed border-l-2 border-accent pl-4 sm:pl-5 py-1 italic bg-accent/5 rounded-r-lg whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: formatInline(trimmed),
            }}
          />
        );
      }

      // Standard editorial article paragraph
      return (
        <p
          key={idx}
          className="text-sm sm:text-base md:text-[17px] leading-[1.85] text-secondary/90 font-normal whitespace-pre-line"
          dangerouslySetInnerHTML={{
            __html: formatInline(trimmed),
          }}
        />
      );
    });
  };

  return (
    <>
      {/* Header section matching /rides/[ride] */}
      <section className="border-b border-border bg-surface/50">
        <Container className="py-4 sm:py-6">
          <nav className="flex items-center gap-2 text-xs text-secondary/90" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <Link href="/stories" className="transition-colors hover:text-white">
              Stories
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <span className="truncate font-semibold text-accent max-w-[12rem] sm:max-w-[16rem]">
              {story.title}
            </span>
            {isAdmin && (
              <span className="ml-auto">
                <AdminEditLink href={`/admin/stories/${story.id}/edit`} label="Edit" />
              </span>
            )}
          </nav>

          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={categoryConfig.tone}>{categoryConfig.label}</Badge>
            <span className="text-xs text-secondary font-medium">
              By {story.author || "Team Moto Bharat"}
            </span>
            <span className="text-muted/60">·</span>
            <span className="font-mono text-[10px] sm:text-[11px] tracking-wider text-muted uppercase tabular-nums">
              {formatDate(story.created_at)}
            </span>
          </div>

          <h1 className="mt-2 text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {story.title}
          </h1>

          {story.subtitle && (
            <p className="mt-2 text-xs sm:text-sm md:text-base text-secondary max-w-3xl leading-relaxed">
              {story.subtitle}
            </p>
          )}
        </Container>
      </section>

      {/* Metrics strip matching /rides/[ride] */}
      {story.stats && story.stats.length > 0 && (
        <div className="border-b border-border bg-surface">
          <Container>
            <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0 [&>*:nth-child(2)]:border-t-0">
              {story.stats.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-6 sm:py-5"
                >
                  <Award className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-mono text-[8.5px] sm:text-[10px] tracking-wider text-muted uppercase">
                      {m.label}
                    </p>
                    <p className="truncate text-xs sm:text-sm font-bold tabular-nums text-text">
                      {m.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* Body container: Main Content + Sidebar */}
      <Container className="grid gap-5 py-5 lg:grid-cols-[2fr_1fr] lg:gap-8 lg:py-8">
        <div className="min-w-0 space-y-5 sm:space-y-8">
          {/* Cover Photo with true 16:9 frame and ambient glow (matching /rides/[ride]) */}
          {story.cover_url && (
            <ZoomableImage
              src={story.cover_url}
              alt={story.title}
              title={`${story.title} — Cover`}
              className="w-full"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-surface-2 shadow-lg">
                <Image
                  src={story.cover_url}
                  alt=""
                  fill
                  aria-hidden="true"
                  className="scale-110 object-cover blur-2xl opacity-35 select-none pointer-events-none"
                />
                <Image
                  src={story.cover_url}
                  alt={story.title}
                  fill
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="relative object-contain"
                  priority
                />
              </div>
            </ZoomableImage>
          )}

          {/* Narrative Body */}
          <article className="space-y-6 sm:space-y-7 pt-4 border-t border-border/60">
            {renderContent(story.content)}
          </article>

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md border border-border/70 bg-surface-2 px-2.5 py-1 text-xs font-medium text-secondary"
                >
                  #{tag.replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}

          {/* Photo Gallery with existing PhotoGrid component */}
          {galleryPhotos.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold">
                  Journey Gallery{" "}
                  <span className="font-mono text-xs font-semibold text-muted tabular-nums">
                    ({galleryPhotos.length})
                  </span>
                </h2>
              </div>
              <PhotoGrid photos={galleryPhotos} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Rider Profile Card */}
          {story.rider_name && (
            <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-3">
              <p className="font-mono text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-wider">
                Featured Rider
              </p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full border border-border bg-surface-2 flex items-center justify-center text-accent shrink-0">
                  <User className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-text truncate">
                    {story.rider_name}
                  </h3>
                  {story.rider_bike && (
                    <p className="text-xs text-muted flex items-center gap-1.5 truncate">
                      <Bike className="size-3 text-muted shrink-0" />
                      <span>{story.rider_bike}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-border/60 flex items-center gap-1.5 text-[11px] text-accent font-medium">
                <ShieldCheck className="size-3.5 text-accent shrink-0" />
                <span>Verified MotoBharat Rider</span>
              </div>
            </div>
          )}

          {/* Community Callout */}
          <div className="rounded-xl border border-border bg-surface-2/60 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-accent" />
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-accent uppercase">
                Got a Story to Tell?
              </p>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Have you tackled a marathon ride, a tough mountain pass, or clocked a milestone? Talk
              to a club admin to feature your journey.
            </p>
            <ButtonLink
              href="/rides"
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs"
            >
              Explore Club Rides
            </ButtonLink>
          </div>
        </aside>
      </Container>

      {/* More Stories (matching /announcements/[a] sibling section) */}
      {moreStories.length > 0 && (
        <Section bg="surface" border="top">
          <Container>
            <SectionHeader
              eyebrow="Chronicles"
              title="More Stories & Milestones"
              cta={{ href: "/stories", label: "All Stories" }}
            />
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
              {moreStories.map((m) => (
                <StoryCard key={m.id} story={m} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
