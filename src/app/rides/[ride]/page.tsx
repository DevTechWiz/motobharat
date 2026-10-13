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
  ArrowRight,
  Route,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { AdminEditLink } from "@/components/layout/admin-edit-link";
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

  // Server-side role check for the admin edit shortcut (display only —
  // /admin enforces proxy + requireAdmin + RLS independently).
  let isAdmin = false;
  if (user) {
    const { data: self } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = self?.role === "admin";
  }

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
      <section className="grain relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-surface-2">
          {ride.cover_url && (
            <Image
              src={ride.cover_url}
              alt={ride.title}
              fill
              sizes="100vw"
              className="animate-ken-burns object-cover opacity-40"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
          <div
            className="absolute -top-32 left-1/4 h-72 w-[36rem] rounded-full bg-accent/10 blur-[120px]"
            aria-hidden
          />
        </div>
        <Container className="relative py-8 sm:py-12">
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
            {isAdmin && (
              <span className="ml-auto">
                <AdminEditLink href={`/admin/rides/${ride.id}/edit`} label="Edit" />
              </span>
            )}
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
          <h1 className="animate-fade-in-up mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">{ride.title}</h1>

          {(ride.meeting_point || ride.destination) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-secondary">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1">
                <MapPin className="size-3 text-accent shrink-0" aria-hidden />
                <span>Start: <strong className="text-white">{ride.meeting_point ?? "Warangal"}</strong></span>
              </span>
              {ride.destination && (
                <>
                  <ArrowRight className="size-3 text-muted shrink-0" aria-hidden />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent font-semibold">
                    <Flag className="size-3 shrink-0" aria-hidden />
                    <span>Destination: <strong className="text-white">{ride.destination}</strong></span>
                  </span>
                </>
              )}
            </div>
          )}

          {Array.isArray(ride.activities) && ride.activities.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {ride.activities.map((act) => (
                <span
                  key={act}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent"
                >
                  <Sparkles className="size-2.5" aria-hidden />
                  {act}
                </span>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Metrics strip */}
      <div className="border-b border-border bg-surface">
        <Container>
          <div className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center gap-3 px-2 py-5 sm:px-6">
                <m.icon className="size-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
                    {m.label}
                  </p>
                  <p className="truncate text-sm font-bold tabular-nums">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Body: details + sticky join card */}
      <Container className="grid gap-8 py-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
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
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-4 p-5">
                <Calendar className="size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="text-xs text-muted">Date</p>
                  <p className="font-semibold">{formatRideDate(ride.starts_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5">
                <Clock className="size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="text-xs text-muted">Assembly Time</p>
                  <p className="font-semibold">{formatRideTime(ride.starts_at)}</p>
                </div>
              </div>
              {ride.meeting_point && (
                <div className="flex items-center gap-4 p-5">
                  <MapPin className="size-5 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">Assembly / Start Point</p>
                    <p className="font-semibold">{ride.meeting_point}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${ride.meeting_point}, Warangal`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    Maps
                    <ArrowUpRight className="size-3 text-accent" aria-hidden />
                  </a>
                </div>
              )}
              {ride.destination && (
                <div className="flex items-center gap-4 p-5">
                  <Flag className="size-5 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">Destination</p>
                    <p className="font-semibold">{ride.destination}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      ride.destination
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-secondary hover:text-accent hover:border-accent/40 transition-colors"
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
                    <p className="text-xs text-muted">Distance</p>
                    <p className="font-semibold tabular-nums">{ride.distance_km} km</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Itinerary / Stops */}
          {Array.isArray(ride.itinerary) && ride.itinerary.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-accent" aria-hidden />
                <h2 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
                  Route & Itinerary ({ride.itinerary.length} {ride.itinerary.length === 1 ? "Stop" : "Stops"})
                </h2>
              </div>
              <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border">
                {ride.itinerary.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className="absolute -left-6 flex size-6 items-center justify-center rounded-full border border-accent/50 bg-surface text-accent text-[11px] font-mono font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        {item.activity && (
                          <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            {item.activity}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1.5 text-xs text-secondary whitespace-pre-wrap leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <div className="relative sticky top-28 space-y-5 overflow-hidden rounded-xl border border-border bg-surface p-6 transition-colors duration-300 hover:border-accent/30">
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-accent/10 blur-[80px]"
              aria-hidden
            />
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
                    `🏍️ MotoBharat Warangal — ${ride.title}\n📅 ${formatRideDate(ride.starts_at)} · ${formatRideTime(ride.starts_at)}\n📍 Start: ${ride.meeting_point ?? "Warangal"}${ride.destination ? `\n🏁 Destination: ${ride.destination}` : ""}\n\nJoin the ride: https://motobharat.co/rides/${ride.slug ?? ride.id}`
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
