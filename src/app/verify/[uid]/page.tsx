import { Bike, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { VerifyPhoto } from "./verify-photo";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate, isPast, tenureSince } from "@/lib/format";
import { isUuid, memberIdFromUserId, type VerifiedMember } from "@/lib/member-card";
import type { Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verify Member", robots: { index: false } };

export default async function VerifyPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const supabase = await createClient();

  let member: VerifiedMember | null = null;
  if (isUuid(uid)) {
    const { data } = await supabase.rpc("verify_member", { card_uid: uid });
    const rows = (data ?? []) as VerifiedMember[];
    member = rows[0] ?? null;
  }

  if (!member) {
    return (
      <Section spacing="spacious">
        <Container className="max-w-xl">
          <EmptyState
            title="Card not found"
            hint="This verification link doesn't match any MotoBharat member. Ask the rider to open their ID card again and show a fresh QR."
            action={
              <ButtonLink href="/" variant="outline" size="sm">
                Back home
              </ButtonLink>
            }
          />
        </Container>
      </Section>
    );
  }

  // Same identity as the card: legal full name, profile name as fallback.
  const fullName = member?.full_name || member?.display_name;
  const tenure = tenureSince(member.member_since);

  // Ride counts are public data (Who's-Riding lists are open on every ride
  // page), so the totals expose nothing new — anon RLS allows both reads.
  // Drafts stay invisible, same as the public UI.
  const { data: joins } = await supabase
    .from("event_members")
    .select("event_id, event:events(id, starts_at, status)")
    .eq("user_id", uid);
  const rides = ((joins ?? []) as unknown as { event: Pick<Ride, "id" | "starts_at" | "status"> }[])
    .map((j) => j.event)
    .filter(Boolean);
  const upcomingCount = rides.filter((r) => r.status === "published" && !isPast(r.starts_at)).length;

  return (
    <Section spacing="compact">
      <Container className="max-w-xl">
        <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
          Member Verification
        </p>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
          <VerifyPhoto src={member.avatar_url} name={fullName} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            {fullName}
          </h1>
          <p className="mt-1 font-mono text-sm font-bold tracking-widest text-accent">
            {memberIdFromUserId(uid)}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {member.city ?? "Warangal"} · Member since {formatDate(member.member_since)}
            {tenure && tenure !== "new member" ? ` · ${tenure} riding` : ""}
          </p>
          {member.member_type === "pillion" ? (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-secondary font-medium">
              <Users className="size-3.5 text-accent" aria-hidden />
              Pillion / Co-Rider
            </p>
          ) : member.bike_model ? (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-secondary">
              <Bike className="size-3.5 text-accent" aria-hidden />
              Rides a {member.bike_model}
            </p>
          ) : null}
          {rides.length > 0 && (
            <p className="mt-1.5 font-mono text-[11px] tracking-wider text-muted uppercase tabular-nums">
              {rides.length} {rides.length === 1 ? "ride" : "rides"}
              {upcomingCount > 0 ? ` · ${upcomingCount} upcoming` : ""}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {member.registered ? (
              <Badge tone="easy">
                <ShieldCheck className="size-3" aria-hidden /> {member.member_type === "pillion" ? "Active Pillion" : "Active Member"}
              </Badge>
            ) : (
              <Badge tone="danger">
                <ShieldAlert className="size-3" aria-hidden /> Suspended
              </Badge>
            )}
          </div>
          <p className="mt-5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted">
            Verified against MotoBharat {member.member_type === "pillion" ? "pillion" : "rider"} records. Photo and name must match the person in
            front of you.
          </p>
        </div>
      </Container>
    </Section>
  );
}
