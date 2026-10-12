import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  Gauge,
  Users,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Share2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRideDate, formatRideTime, isPast } from "@/lib/format";
import { JoinLeaveButton } from "./join-leave-button";
import { PhotoGrid, type GalleryPhoto } from "@/components/rides/photo-grid";
import type { GalleryItem, Ride, RideMember } from "@/lib/types";

export const dynamic = "force-dynamic";

const difficultyTone = { easy: "easy", moderate: "moderate", hard: "hard" } as const;

async function getRide(param: string) {
  const supabase = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

  const { data } = await supabase
    .from("events")
    .select("*")
    .or(isUuid ? `id.eq.${param},slug.eq.${param}` : `slug.eq.${param}`)
    .maybeSingle();
  return (data as unknown as Ride) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ride: string }>;
}) {
  const { ride } = await params;
  const data = await getRide(ride);
  if (!data) return { title: "Ride not found" };
  return {
    title: data.title,
    description: data.description || `Community ride from Warangal · ${formatRideDate(data.starts_at)}`,
  };
}

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ ride: string }>;
}) {
  const { ride: rideParam } = await params;
  const ride = await getRide(rideParam);
  if (!ride) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: members }, { data: membership }, { data: media }] = await Promise.all([
    supabase
      .from("event_members")
      .select("*, profile:profiles(id, display_name, avatar_url)")
      .eq("event_id", ride.id)
      .order("created_at"),
    user
      ? supabase
          .from("event_members")
          .select("user_id")
          .eq("event_id", ride.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("gallery")
      .select("*")
      .eq("event_id", ride.id)
      .order("created_at"),
  ]);

  const riderList = (members ?? []) as RideMember[];
  const isMember = !!membership;
  const photos: GalleryPhoto[] = ((media ?? []) as GalleryItem[]).map((m) => ({
    url: m.url,
    thumb: m.thumb_url,
    alt: m.alt,
  }));

  const past = isPast(ride.starts_at) || ride.status === "completed";
  const cancelled = ride.status === "cancelled";

  const metrics = [
    { icon: Calendar, label: "Date", value: formatRideDate(ride.starts_at) },
    { icon: Clock, label: "Assembly", value: formatRideTime(ride.starts_at) },
    ...(ride.distance_km != null
      ? [{ icon: Gauge, label: "Distance", value: `${ride.distance_km} km` }]
      : []),
    { icon: Users, label: "Riders", value: String(riderList.length) },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative border-b border-border">
        <div className="absolute inset-0 bg-surface-2">
          {ride.cover_url && (
            <Image
              src={ride.cover_url}
              alt={ride.title}
              fill
              sizes="100vw"
              className="object-cover opacity-40"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
        </div>
        <Container className="relative py-12 sm:py-16">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-secondary" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <Link href="/rides" className="transition-colors hover:text-white">
              Rides
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <span className="truncate font-semibold text-accent max-w-[16rem]">{ride.title}</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {ride.difficulty && (
              <Badge tone={difficultyTone[ride.difficulty]}>{ride.difficulty}</Badge>
            )}
            {cancelled && <Badge tone="danger">Cancelled</Badge>}
            {!cancelled && past && <Badge tone="neutral">Completed</Badge>}
            {!cancelled && !past && ride.status === "published" && (
              <Badge tone="easy">Open for joining</Badge>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold sm:text-5xl">{ride.title}</h1>
        </Container>
      </section>

      {/* Metrics strip */}
      <div className="border-b border-border bg-surface">
        <Container>
          <dl className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center gap-3 px-2 py-5 sm:px-6">
                <m.icon className="size-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0">
                  <dt className="font-mono text-[10px] tracking-wider text-muted uppercase">
                    {m.label}
                  </dt>
                  <dd className="truncate text-sm font-bold tabular-nums">{m.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      {/* Body: details + sticky join card */}
      <Container className="grid gap-10 py-12 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          {ride.description && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
                About this ride
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-secondary">{ride.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
              Ride Details
            </h2>
            <dl className="divide-y divide-border rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-4 p-5">
                <Calendar className="size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <dt className="text-xs text-muted">Date</dt>
                  <dd className="font-semibold">{formatRideDate(ride.starts_at)}</dd>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5">
                <Clock className="size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <dt className="text-xs text-muted">Time</dt>
                  <dd className="font-semibold">{formatRideTime(ride.starts_at)}</dd>
                </div>
              </div>
              {ride.meeting_point && (
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <MapPin className="size-5 shrink-0 text-accent" aria-hidden />
                    <div>
                      <dt className="text-xs text-muted">Meeting Point</dt>
                      <dd className="font-semibold">{ride.meeting_point}</dd>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${ride.meeting_point}, Warangal`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    Maps
                    <ArrowUpRight className="size-3 text-accent" aria-hidden />
                  </a>
                </div>
              )}
              {ride.distance_km != null && (
                <div className="flex items-center gap-4 p-5">
                  <Gauge className="size-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted">Distance</dt>
                    <dd className="font-semibold tabular-nums">{ride.distance_km} km</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
              Who&apos;s Riding ({riderList.length})
            </h2>
            {riderList.length === 0 ? (
              <p className="text-sm text-muted">
                No riders joined yet — be the first on the column.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {riderList.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <Avatar
                      name={m.profile?.display_name ?? "Rider"}
                      src={m.profile?.avatar_url}
                      size="sm"
                    />
                    <span className="truncate text-sm font-semibold">
                      {m.profile?.display_name ?? "Rider"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {photos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
                Ride Gallery ({photos.length})
              </h2>
              <PhotoGrid photos={photos} />
            </div>
          )}
        </div>

        {/* Sticky join card */}
        <aside>
          <div className="sticky top-28 space-y-5 rounded-xl border border-border bg-surface p-6">
            <div className="space-y-1">
              <p className="font-mono text-[10px] tracking-wider text-accent uppercase">
                Column Allocation
              </p>
              <h3 className="text-lg font-bold">
                {cancelled
                  ? "Ride Cancelled"
                  : past
                    ? "Ride Completed"
                    : "Registration Open"}
              </h3>
              <p className="text-xs text-secondary">
                {cancelled
                  ? "This ride was cancelled. Check announcements for details."
                  : past
                    ? "This ride has already departed. Photos may be in the gallery."
                    : "Join the column — show up on time, geared up, ready to roll."}
              </p>
            </div>

            {!cancelled && (
              <>
                <JoinLeaveButton rideId={ride.id} isMember={isMember} />
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `🏍️ MotoBharat Warangal — ${ride.title}\n📅 ${formatRideDate(ride.starts_at)} · ${formatRideTime(ride.starts_at)}\n📍 Meeting: ${ride.meeting_point ?? "Warangal"}\n\nJoin the ride: https://motobharat.in/rides/${ride.slug ?? ride.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-xs font-bold tracking-wider text-secondary uppercase transition-colors hover:border-[#25D366]/60 hover:text-[#25D366] hover:bg-surface-3"
                >
                  <Share2 className="size-3.5" aria-hidden />
                  Share on WhatsApp
                </a>
              </>
            )}

            <div className="space-y-2.5 border-t border-border pt-4 text-xs text-secondary">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
                <span>
                  Full gear mandatory. Read the{" "}
                  <Link href="/safety" className="font-semibold text-accent hover:underline">
                    Safety Code
                  </Link>{" "}
                  before joining.
                </span>
              </div>
              <p className="font-mono text-muted tabular-nums">
                {riderList.length} {riderList.length === 1 ? "rider" : "riders"} on this ride
              </p>
            </div>
          </div>
        </aside>
      </Container>
    </>
  );
}
