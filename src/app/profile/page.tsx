import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, ShieldCheck, ShieldAlert, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { Avatar } from "@/components/ui/avatar";
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
    .select("registered, age, gender, phone, blood_group, bike_model, bike_reg_no, gear_level, experience_level")
    .eq("user_id", user.id)
    .maybeSingle();

  const isStep1Done = Boolean(rd?.age && rd?.gender && (rd?.phone || profile?.phone));
  const isRegistered = Boolean(rd?.registered);

  const registrationHref = isRegistered
    ? "/profile/kyc"
    : isStep1Done
    ? "/profile/kyc"
    : "/profile/setup";

  const registrationLabel = isRegistered
    ? "Edit Rider KYC"
    : isStep1Done
    ? "Complete Rider KYC"
    : "Complete Registration";

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
      <Container className="py-20 text-center text-secondary">
        Profile not found. Sign out and back in to refresh.
      </Container>
    );
  }

  return (
    <>
      <Section spacing="compact" border="bottom">
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar name={profile.display_name} src={profile.avatar_url} size="xl" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{profile.display_name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={profile.role === "admin" ? "hard" : "easy"}>
                    {profile.role}
                  </Badge>
                  {isRegistered ? (
                    <Badge tone="easy">Registered</Badge>
                  ) : isStep1Done ? (
                    <Badge tone="moderate">KYC Pending</Badge>
                  ) : (
                    <Badge tone="danger">Setup Incomplete</Badge>
                  )}
                  {profile.city && <span className="font-mono text-xs text-muted">{profile.city}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2 sm:gap-1.5 w-full sm:w-auto">
              <ButtonLink
                href={registrationHref}
                variant={isRegistered ? "outline" : "primary"}
                size="sm"
                fullWidth
                className="sm:w-auto"
              >
                {registrationLabel}
              </ButtonLink>
              {isStep1Done && (
                <Link
                  href="/profile/setup?edit=true"
                  className="text-center sm:text-right text-[11px] text-muted hover:text-secondary underline underline-offset-2 transition-colors"
                >
                  Edit basic details
                </Link>
              )}
            </div>
          </div>

          {!isRegistered && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <p className="leading-relaxed">
                Your rider KYC is incomplete — you can browse everything, but{" "}
                <span className="font-semibold text-white">joining rides is blocked</span> until you finish
                registration.{" "}
                <Link href={registrationHref} className="font-semibold text-accent hover:text-accent-hover underline underline-offset-2 transition-colors">
                  Finish now →
                </Link>
              </p>
            </div>
          )}

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
      {isRegistered && (
        <script
          dangerouslySetInnerHTML={{
            __html: "try{localStorage.removeItem('motobharat_draft_kyc');localStorage.removeItem('motobharat_draft_setup');}catch(e){}",
          }}
        />
      )}
    </>
  );
}
