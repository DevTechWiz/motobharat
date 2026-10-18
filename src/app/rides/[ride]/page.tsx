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
  Flag,
  Route,
  Sparkles,
  MessageCircle,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { AdminEditLink } from "@/components/layout/admin-edit-link";
import { formatRideDate, formatRideTime, isPast } from "@/lib/format";
import { JoinLeaveButton } from "./join-leave-button";
import { PhotoGrid, type GalleryPhoto } from "@/components/rides/photo-grid";
import { ZoomableImage } from "@/components/ui/image-lightbox";
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
  const [{ ride: rideParam }, supabase] = await Promise.all([params, createClient()]);
  const [ride, { data: authData }] = await Promise.all([
    getRide(rideParam),
    supabase.auth.getUser(),
  ]);
  if (!ride) notFound();

  const user = authData?.user ?? null;

  const [
    { data: members },
    { data: membership },
    { data: media },
    adminProfileRes,
  ] = await Promise.all([
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
    user
      ? supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isAdmin = adminProfileRes?.data?.role === "admin";

  const riderList = (members ?? []) as RideMember[];
  const isMember = !!membership;
  const photos: GalleryPhoto[] = ((media ?? []) as GalleryItem[]).map((m) => ({
    url: m.url,
    thumb: m.thumb_url || m.url,
    alt: m.alt || "Ride photo",
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
      {/* Ride Header */}
      <section className="border-b border-border bg-surface/50">
        <Container className="py-4 sm:py-6">
          <nav className="flex items-center gap-2 text-xs text-secondary/90" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <Link href="/rides" className="transition-colors hover:text-white">
              Rides
            </Link>
            <ChevronRight className="size-3 text-muted" aria-hidden />
            <span className="truncate font-semibold text-accent max-w-[12rem] sm:max-w-[16rem]">{ride.title}</span>
            {isAdmin && (
              <span className="ml-auto">
                <AdminEditLink href={`/admin/rides/${ride.id}/edit`} label="Edit" />
              </span>
            )}
          </nav>

          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {ride.difficulty && (
              <Badge tone={difficultyTone[ride.difficulty]}>{ride.difficulty}</Badge>
            )}
            {cancelled && <Badge tone="danger">Cancelled</Badge>}
            {!cancelled && past && <Badge tone="neutral">Completed</Badge>}
            {!cancelled && !past && ride.status === "published" && (
              <Badge tone="easy">Open for joining</Badge>
            )}
          </div>

          <h1 className="mt-2 text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {ride.title}
          </h1>

          {(ride.meeting_point || ride.destination) && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-secondary">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 sm:px-3 sm:py-1">
                <MapPin className="size-3 text-accent shrink-0" aria-hidden />
                <span>
                  {ride.meeting_point && ride.destination && ride.meeting_point !== ride.destination ? (
                    <>
                      <strong className="text-white">{ride.meeting_point}</strong>
                      <span className="mx-1 text-muted">→</span>
                      <strong className="text-white">{ride.destination}</strong>
                    </>
                  ) : (
                    <strong className="text-white">{ride.destination || ride.meeting_point}</strong>
                  )}
                </span>
              </span>
            </div>
          )}
        </Container>
      </section>

      {/* Metrics strip */}
      <div className="border-b border-border bg-surface">
        <Container>
          <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0 [&>*:nth-child(2)]:border-t-0">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-6 sm:py-5">
                <m.icon className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="font-mono text-[8.5px] sm:text-[10px] tracking-wider text-muted uppercase">
                    {m.label}
                  </p>
                  <p className="truncate text-xs sm:text-sm font-bold tabular-nums">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Body: details + sticky join card */}
      <Container className="grid gap-5 py-5 lg:grid-cols-[2fr_1fr] lg:gap-8 lg:py-8">
        <div className="min-w-0 space-y-5 sm:space-y-8">
          {/* Cover Card - True 16:9 frame with zero-clip containment & ambient backdrop */}
          {ride.cover_url && (
            <ZoomableImage
              src={ride.cover_url}
              alt={ride.title}
              title={`${ride.title} — Official Cover`}
              className="w-full"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-surface-2 shadow-lg">
                <Image
                  src={ride.cover_url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  aria-hidden="true"
                  className="scale-110 object-cover blur-2xl opacity-35 select-none pointer-events-none"
                />
                <Image
                  src={ride.cover_url}
                  alt={ride.title}
                  fill
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="relative object-contain"
                  priority
                />
              </div>
            </ZoomableImage>
          )}

          {/* Activities & Highlights moved into content area */}
          {Array.isArray(ride.activities) && ride.activities.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border bg-surface p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-accent" />
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-accent uppercase">
                  Ride Highlights & Activities
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {ride.activities.map((act) => (
                  <span
                    key={act}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-accent"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ride.description && (
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-xs sm:text-sm font-bold tracking-[0.18em] text-accent uppercase">
                About this ride
              </h2>
              <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-secondary">{ride.description}</p>
            </div>
          )}

          <div className="space-y-2.5 sm:space-y-3">
            <h2 className="text-xs sm:text-sm font-bold tracking-[0.18em] text-accent uppercase">
              Ride Details
            </h2>
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-2.5 p-3 sm:gap-4 sm:p-5">
                <Calendar className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted">Date</p>
                  <p className="text-xs sm:text-sm font-semibold">{formatRideDate(ride.starts_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 sm:gap-4 sm:p-5">
                <Clock className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted">Assembly Time</p>
                  <p className="text-xs sm:text-sm font-semibold">{formatRideTime(ride.starts_at)}</p>
                </div>
              </div>
              {ride.meeting_point && (
                <div className="flex items-center gap-2.5 p-3 sm:gap-4 sm:p-5">
                  <MapPin className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted">Assembly / Start Point</p>
                    <p className="text-xs sm:text-sm font-semibold truncate sm:whitespace-normal">{ride.meeting_point}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${ride.meeting_point}, Warangal`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[34px] sm:min-h-[44px] shrink-0 items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    Maps
                    <ArrowUpRight className="size-3 text-accent" aria-hidden />
                  </a>
                </div>
              )}
              {ride.destination && (
                <div className="flex items-center gap-2.5 p-3 sm:gap-4 sm:p-5">
                  <Flag className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted">Destination</p>
                    <p className="text-xs sm:text-sm font-semibold truncate sm:whitespace-normal">{ride.destination}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      ride.destination
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[34px] sm:min-h-[44px] shrink-0 items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    Maps
                    <ArrowUpRight className="size-3 text-accent" aria-hidden />
                  </a>
                </div>
              )}
              {ride.distance_km != null && (
                <div className="flex items-center gap-2.5 p-3 sm:gap-4 sm:p-5">
                  <Gauge className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted">Distance</p>
                    <p className="text-xs sm:text-sm font-semibold tabular-nums">{ride.distance_km} km</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Itinerary / Stops */}
          {Array.isArray(ride.itinerary) && ride.itinerary.length > 0 && (
            <div className="space-y-2.5 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-accent" aria-hidden />
                <h2 className="text-xs sm:text-sm font-bold tracking-[0.18em] text-accent uppercase">
                  Route & Itinerary ({ride.itinerary.length} {ride.itinerary.length === 1 ? "Stop" : "Stops"})
                </h2>
              </div>
              <div className="relative pl-5 sm:pl-6 space-y-2.5 sm:space-y-4 itinerary-rail">
                {ride.itinerary.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-2.5 sm:gap-4">
                    <div className="absolute -left-5 sm:-left-6 top-1/2 -translate-y-1/2 flex size-5 sm:size-6 items-center justify-center rounded-full border border-accent/50 bg-surface text-accent text-[9px] sm:text-[11px] font-mono font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 rounded-xl border border-border bg-surface p-2.5 sm:p-4 transition-colors hover:border-accent/40">
                      <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-white">{item.title}</h3>
                        {item.activity && (
                          <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-semibold text-accent">
                            {item.activity}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1 text-[10.5px] sm:text-xs text-secondary whitespace-pre-wrap leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2.5 sm:space-y-3">
            <h2 className="text-xs sm:text-sm font-bold tracking-[0.18em] text-accent uppercase">
              Who&apos;s Riding ({riderList.length})
            </h2>
            {riderList.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted">
                No riders joined yet — be the first on the column.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center">
                  {riderList.slice(0, 6).map((m) => {
                    const name = m.profile?.display_name ?? "Rider";
                    return (
                      <span key={m.user_id} title={name} className="-ml-2 shrink-0 first:ml-0">
                        <Avatar name={name} src={m.profile?.avatar_url} size="sm" className="ring-2 ring-bg" />
                      </span>
                    );
                  })}
                  {riderList.length > 6 && (
                    <span className="-ml-2 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[10px] font-bold text-accent ring-2 ring-bg">
                      +{riderList.length - 6}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted">
                  {riderList.length === 1
                    ? "1 rider on the column"
                    : `${riderList.length} riders on the column`}
                </p>
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              <h2 className="text-xs sm:text-sm font-bold tracking-[0.18em] text-accent uppercase">
                Ride Gallery ({photos.length})
              </h2>
              <PhotoGrid photos={photos} />
            </div>
          )}
        </div>

        {/* Sticky join card */}
        <aside className="min-w-0">
          <div className="relative space-y-3.5 sm:space-y-4 overflow-hidden rounded-xl border border-border bg-surface p-3.5 sm:p-6 transition-[border-color] duration-200 hover:border-accent/30 sm:sticky sm:top-24">
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-accent/10 blur-[80px]"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="font-mono text-[9px] sm:text-[10px] tracking-wider text-accent uppercase">
                Column Allocation
              </p>
              <h3 className="text-sm font-bold sm:text-lg">
                {cancelled
                  ? "Ride Cancelled"
                  : past
                    ? "Ride Completed"
                    : ride.joining_paused
                      ? "Registrations Closed"
                      : "Registration Open"}
              </h3>
              <p className="text-[11px] sm:text-xs text-secondary leading-relaxed">
                {cancelled
                  ? "This ride was cancelled. Check announcements for details."
                  : past
                    ? "This ride has already departed. Photos may be in the gallery."
                    : ride.joining_paused
                      ? "New joinings are paused for now by the admin."
                      : "Join the column — show up on time, geared up, ready to roll."}
              </p>
            </div>

            {!cancelled && (
              <>
                <JoinLeaveButton
                  rideId={ride.id}
                  isMember={isMember}
                  joiningPaused={ride.joining_paused}
                  isPast={past}
                  isFull={
                    ride.max_riders != null &&
                    riderList.length >= ride.max_riders
                  }
                />

                {ride.whatsapp_group_url && (
                  isMember || isAdmin ? (
                    <a
                      href={ride.whatsapp_group_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[38px] sm:min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#25D366]/40 bg-[#25D366]/15 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-bold tracking-wider text-[#25D366] uppercase transition-[color,border-color,background-color,transform] duration-150 ease-out hover:border-[#25D366] hover:bg-[#25D366]/25 active:scale-[0.97]"
                    >
                      <MessageCircle className="size-3.5" aria-hidden />
                      Join WhatsApp Group
                    </a>
                  ) : !past ? (
                    <div className="flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-surface-2/60 px-3 py-2 text-center text-[10.5px] sm:text-[11px] text-muted">
                      <Lock className="size-3 shrink-0 text-muted/70" aria-hidden />
                      <span>Join this ride to unlock the WhatsApp group</span>
                    </div>
                  ) : null
                )}

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    past
                      ? `🏍️ MotoBharat Warangal — ${ride.title}\n📅 ${formatRideDate(ride.starts_at)}\n📍 ${ride.meeting_point ?? "Warangal"}${ride.destination ? ` → ${ride.destination}` : ""}\n\nView ride recap: https://motobharat.co/rides/${ride.slug ?? ride.id}`
                      : `🏍️ MotoBharat Warangal — ${ride.title}\n📅 ${formatRideDate(ride.starts_at)} · ${formatRideTime(ride.starts_at)}\n📍 Start: ${ride.meeting_point ?? "Warangal"}${ride.destination ? `\n🏁 Destination: ${ride.destination}` : ""}\n\nJoin the ride: https://motobharat.co/rides/${ride.slug ?? ride.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[38px] sm:min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-bold tracking-wider text-secondary uppercase transition-[color,border-color,background-color,transform] duration-150 ease-out hover:border-[#25D366]/60 hover:bg-surface-3 hover:text-[#25D366] active:scale-[0.97]"
                >
                  <Share2 className="size-3.5" aria-hidden />
                  Share on WhatsApp
                </a>
              </>
            )}

            <div className="space-y-1.5 sm:space-y-2 border-t border-border pt-3 sm:pt-3.5 text-[11px] sm:text-xs text-secondary">
              <div className="flex items-start gap-1.5 sm:gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
                <span>
                  {past ? (
                    <>
                      Full gear mandatory on all rides. Review the{" "}
                      <Link href="/safety" className="font-semibold text-accent hover:underline">
                        Safety Code
                      </Link>.
                    </>
                  ) : (
                    <>
                      Full gear mandatory. Read the{" "}
                      <Link href="/safety" className="font-semibold text-accent hover:underline">
                        Safety Code
                      </Link>{" "}
                      before joining.
                    </>
                  )}
                </span>
              </div>
              <p className="font-mono text-muted tabular-nums text-[10px] sm:text-xs">
                {riderList.length} {riderList.length === 1 ? "rider" : "riders"} on this ride
              </p>
            </div>
          </div>
        </aside>
      </Container>
    </>
  );
}
