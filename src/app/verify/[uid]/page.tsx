import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/format";
import { isUuid, memberIdFromUserId, type VerifiedMember } from "@/lib/member-card";

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

  return (
    <Section spacing="compact">
      <Container className="max-w-xl">
        <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
          Member Verification
        </p>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
          <Avatar
            src={member.avatar_url}
            name={fullName}
            size="xl"
            className="mx-auto"
          />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            {fullName}
          </h1>
          <p className="mt-1 font-mono text-sm font-bold tracking-widest text-accent">
            {memberIdFromUserId(uid)}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {member.city ?? "Warangal"} · Member since {formatDate(member.member_since)}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {member.registered ? (
              <Badge tone="easy">
                <ShieldCheck className="size-3" aria-hidden /> Active member
              </Badge>
            ) : (
              <Badge tone="danger">
                <ShieldAlert className="size-3" aria-hidden /> Suspended
              </Badge>
            )}
          </div>
          <p className="mt-5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted">
            Verified against MotoBharat rider records. Photo and name must match the person in
            front of you.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="font-mono text-xs font-semibold text-muted transition-colors hover:text-accent"
          >
            ← motobharat.co
          </Link>
        </div>
      </Container>
    </Section>
  );
}
