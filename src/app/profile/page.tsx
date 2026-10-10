import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, ShieldCheck, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatRideDate, isPast } from "@/lib/format";
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
    .select("registered, age, gender, blood_group")
    .eq("user_id", user.id)
    .maybeSingle();

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
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={profile.display_name} src={profile.avatar_url} size="xl" />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold">{profile.display_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={profile.role === "admin" ? "hard" : "easy"}>
                  {profile.role}
                </Badge>
                {rd?.registered ? (
                  <Badge tone="easy">Registered</Badge>
                ) : (
                  <Badge tone="danger">KYC Incomplete</Badge>
                )}
                {profile.city && <span className="text-sm text-muted">{profile.city}</span>}
              </div>
            </div>
            <Link href={rd?.registered ? "/profile/kyc" : "/profile/setup"}>
              <Button variant="outline" size="sm">
                {rd?.registered ? "Edit Rider KYC" : "Complete Registration"}
              </Button>
            </Link>
          </div>
          {!rd?.registered && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <p>
                Your rider KYC is incomplete — you can browse everything, but{" "}
                <span className="font-semibold">joining rides is blocked</span> until you finish
                registration.{" "}
                <Link href="/profile/setup" className="text-accent underline underline-offset-2">
                  Finish now →
                </Link>
              </p>
            </div>
          )}
          {rd?.registered && rd.blood_group && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-3.5 text-accent" aria-hidden />
              Blood group {rd.blood_group} · age {rd.age} ·{" "}
              <Link href="/profile/kyc" className="text-accent underline underline-offset-2">
                update
              </Link>
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
                <span className="block font-mono text-2xl font-bold text-white tabular-nums">
                  {s.value}
                </span>
                <span className="mt-2 block h-px w-6 bg-accent/70" aria-hidden />
                <span className="mt-2 block font-mono text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
              Upcoming Rides ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState
                className="py-10"
                title="No upcoming rides"
                hint="When you join a ride, it shows up here with its date and meeting point."
                action={
                  <Link href="/rides">
                    <Button variant="outline" size="sm">
                      Browse Rides
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {upcoming.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                    <Calendar className="size-4 shrink-0 text-accent" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="text-xs text-muted">{formatRideDate(r.starts_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
              Past Rides ({past.length})
            </h2>
            {past.length === 0 ? (
              <EmptyState
                className="py-10"
                title="No past rides yet"
                hint="Completed rides stay here with their date and gallery photos."
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {past.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 opacity-70">
                    <Calendar className="size-4 shrink-0 text-muted" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="text-xs text-muted">{formatRideDate(r.starts_at)}</p>
                    </div>
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
