import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, ShieldCheck, ShieldAlert, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { ProfileAvatar } from "./profile-avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatRideDate, isPast } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: rd } = await supabase
    .from("rider_details")
    .select("registered, age, gender, phone, blood_group, bike_model, bike_reg_no, gear_level, experience_level, kyc_submitted_at, kyc_rejected")
    .eq("user_id", user.id)
    .maybeSingle();

  const isStep1Done = Boolean(rd?.age && rd?.gender && (rd?.phone || profile?.phone));
  const isRegistered = Boolean(rd?.registered);
  const isRejected = !isRegistered && Boolean(rd?.kyc_rejected);
  const isPending = !isRegistered && !isRejected && Boolean(rd?.kyc_submitted_at);

  const registrationHref = isRegistered || isStep1Done ? "/profile/kyc" : "/profile/setup";

  const { data: memberships } = await supabase
    .from("event_members")
    .select("event_id, created_at, event:events(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rides = ((memberships ?? []) as unknown as { event: Ride }[])
    .map((m) => m.event)
    .filter(Boolean);
  const upcoming = rides.filter((r) => !isPast(r.starts_at));
  const past = rides.filter((r) => isPast(r.starts_at));

  if (!profile) {
    return (
      <Container className="py-12 text-center text-secondary">
        Profile not found. Sign out and back in to refresh.
      </Container>
    );
  }

  return (
    <>
      <Section spacing="compact" border="bottom">
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/10 blur-[90px]"
              aria-hidden
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <ProfileAvatar
                  displayName={profile.display_name}
                  avatarUrl={profile.avatar_url}
                />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{profile.display_name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={profile.role === "admin" ? "hard" : "easy"}>
                    {profile.role}
                  </Badge>
                  {isRegistered ? (
                    <Badge tone="easy">Registered</Badge>
                  ) : isRejected ? (
                    <Badge tone="danger">KYC Rejected</Badge>
                  ) : isPending ? (
                    <Badge tone="moderate">Approval Pending</Badge>
                  ) : isStep1Done ? (
                    <Badge tone="moderate">KYC Pending</Badge>
                  ) : (
                    <Badge tone="danger">Setup Incomplete</Badge>
                  )}
                  {profile.city && <span className="font-mono text-xs text-muted">{profile.city}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto sm:items-end">
              <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-muted uppercase sm:text-right">
                Edit profile
              </p>
              <div
                className="flex overflow-hidden rounded-lg border border-border-strong"
                role="group"
                aria-label="Edit profile sections"
              >
                <Link
                  href="/profile/setup?edit=true"
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 bg-surface-2 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-surface-3 hover:text-accent sm:flex-none"
                >
                  <span className="font-mono text-[10px] text-accent">1</span>
                  Basic info
                </Link>
                <span className="w-px bg-border-strong" aria-hidden />
                <Link
                  href="/profile/kyc"
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 bg-surface-2 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-surface-3 hover:text-accent sm:flex-none"
                >
                  <span className="font-mono text-[10px] text-accent">2</span>
                  Safety &amp; KYC
                </Link>
              </div>
            </div>
          </div>
          </div>

          {isRejected ? (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <p className="leading-relaxed">
                An admin sent your KYC back — check your details and licence photo, then resubmit.{" "}
                <Link href="/profile/kyc" className="font-semibold text-accent hover:text-accent-hover underline underline-offset-2 transition-colors">
                  Fix and resubmit →
                </Link>
              </p>
            </div>
          ) : isPending ? (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <p className="leading-relaxed">
                Your KYC is submitted — an admin will review it shortly. Joining rides and your ID
                card unlock on approval.{" "}
                <Link href="/profile/kyc" className="font-semibold text-accent hover:text-accent-hover underline underline-offset-2 transition-colors">
                  View submission →
                </Link>
              </p>
            </div>
          ) : !isRegistered ? (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <p className="leading-relaxed">
                Your rider KYC is incomplete — you can browse everything, but{" "}
                <span className="font-semibold text-white">joining rides is blocked</span> until you finish
                registration and an admin approves it.{" "}
                <Link href={registrationHref} className="font-semibold text-accent hover:text-accent-hover underline underline-offset-2 transition-colors">
                  Finish now →
                </Link>
              </p>
            </div>
          ) : null}

          {rd?.registered && (
            <div className="mt-6 rounded-xl border border-success/30 bg-gradient-to-r from-success/10 via-surface-2 to-surface p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-border/70 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-success" aria-hidden />
                  <span className="font-mono text-xs font-bold text-success uppercase tracking-wider">
                    Verified Touring Rider
                  </span>
                </div>
                <Link
                  href="/profile/kyc"
                  className="text-[11px] font-bold text-secondary hover:text-success uppercase tracking-wider transition-colors"
                >
                  Update KYC →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div>
                  <span className="block font-mono text-[10px] text-muted uppercase">Machine</span>
                  <span className="font-semibold text-text truncate block">{rd.bike_model || "—"}</span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-muted uppercase">Plate No.</span>
                  <span className="font-mono font-bold text-text uppercase">{rd.bike_reg_no || "—"}</span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-muted uppercase">Blood Group</span>
                  <span className="font-bold text-text">{rd.blood_group || "—"}</span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-muted uppercase">Experience</span>
                  <span className="capitalize text-text">{rd.experience_level || "—"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: rides.length, label: "Rides Joined" },
              { value: upcoming.length, label: "Upcoming" },
              { value: past.length, label: "Completed" },
              { value: rd?.registered ? "Yes" : "No", label: "KYC Done" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-surface px-4 py-3.5">
                <span
                  className={cn(
                    "block font-mono text-2xl font-bold tabular-nums",
                    s.label === "KYC Done"
                      ? rd?.registered
                        ? "text-success"
                        : "text-muted"
                      : "text-white"
                  )}
                >
                  {s.value}
                </span>
                <span
                  className={cn(
                    "mt-2 block h-px w-6",
                    s.label === "KYC Done" && rd?.registered ? "bg-success/70" : "bg-accent/70"
                  )}
                  aria-hidden
                />
                <span className="mt-2 block font-mono text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="font-mono text-xs font-bold tracking-[0.18em] text-accent uppercase">
                Upcoming Rides ({upcoming.length})
              </h2>
              {upcoming.length > 0 && (
                <Link
                  href="/rides"
                  className="font-mono text-[11px] text-muted hover:text-accent uppercase tracking-wider transition-colors"
                >
                  Explore All →
                </Link>
              )}
            </div>
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-surface/40 p-6 sm:p-8">
                <EmptyState
                  className="py-4"
                  title="No upcoming rides"
                  hint="When you join a ride, it shows up here with its date and meeting point."
                  action={
                    <ButtonLink href="/rides" variant="outline" size="sm">
                      Browse Rides
                    </ButtonLink>
                  }
                />
              </div>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={r.slug ? `/rides/${r.slug}` : `/rides/${r.id}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-all duration-150 hover:border-accent/60 hover:bg-surface-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Calendar className="size-4 shrink-0 text-accent" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text group-hover:text-white truncate">
                            {r.title}
                          </p>
                          <p className="text-xs text-muted">{formatRideDate(r.starts_at)}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-muted group-hover:text-accent transition-colors shrink-0">
                        View <ArrowUpRight className="size-3.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="font-mono text-xs font-bold tracking-[0.18em] text-accent uppercase">
                Past Rides ({past.length})
              </h2>
              {past.length > 0 && (
                <Link
                  href="/rides"
                  className="font-mono text-[11px] text-muted hover:text-accent uppercase tracking-wider transition-colors"
                >
                  Gallery & Memories →
                </Link>
              )}
            </div>
            {past.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-surface/40 p-6 sm:p-8">
                <EmptyState
                  className="py-4"
                  title="No past rides yet"
                  hint="Completed rides stay here with their date and gallery photos."
                />
              </div>
            ) : (
              <ul className="space-y-2.5">
                {past.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={r.slug ? `/rides/${r.slug}` : `/rides/${r.id}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 opacity-80 transition-all duration-150 hover:opacity-100 hover:border-border-strong hover:bg-surface-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Calendar className="size-4 shrink-0 text-muted group-hover:text-accent" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text group-hover:text-white truncate">
                            {r.title}
                          </p>
                          <p className="text-xs text-muted">{formatRideDate(r.starts_at)}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted group-hover:text-secondary transition-colors shrink-0">
                        Details <ArrowUpRight className="size-3.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
