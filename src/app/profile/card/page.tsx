import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { SITE_BASE, memberIdFromUserId, verifyUrlForUser } from "@/lib/member-card";
import { MemberCardViewer } from "./member-card-viewer";

export const dynamic = "force-dynamic";

export const metadata = { title: "Member ID Card", robots: { index: false } };

export default async function MemberCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/card");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, city, created_at, role")
    .eq("id", user.id)
    .single();

  const { data: rd } = await supabase
    .from("rider_details")
    .select(
      "registered, age, gender, phone, bike_model, bike_reg_no, blood_group, experience_level, digital_signature, kyc_submitted_at, kyc_rejected, emergency_contact_name, emergency_contact_phone, emergency_contact_relation"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <Container className="py-12 text-center text-secondary">
        Profile not found. Sign out and back in to refresh.
      </Container>
    );
  }

  const isRegistered = Boolean(rd?.registered);
  const isRejected = !isRegistered && Boolean(rd?.kyc_rejected);
  const isPending = !isRegistered && !isRejected && Boolean(rd?.kyc_submitted_at);
  const isStep1Done = Boolean(rd?.age && rd?.gender && rd?.phone);
  const registrationHref = isRegistered || isStep1Done ? "/profile/kyc" : "/profile/setup";

  // QR URLs must be deterministic and public: a card gets screenshotted and
  // scanned months later, so the base never comes from request headers
  // (localhost on dev, staging hosts on preview). Explicit env wins, else prod.
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || SITE_BASE;
  const memberId = memberIdFromUserId(user.id);
  const verifyUrl = verifyUrlForUser(user.id, base);
  // Legal identity goes on the card; fall back to the profile name for legacy
  // rows approved before the signature existed.
  const fullName = rd?.digital_signature || profile.display_name;

  return (
    <Section spacing="compact">
      <Container className="max-w-4xl">
        <Link
          href="/profile"
          className="card-print-hide inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to profile
        </Link>

        <p className="card-print-hide mt-6 font-mono text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
          Official Member ID Card
        </p>

        {isRejected ? (
          <div className="card-print-hide mt-5 flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <p className="leading-relaxed">
              An admin sent your KYC back — fix your details and resubmit to unlock your card.{" "}
              <Link
                href="/profile/kyc"
                className="font-semibold text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
              >
                Fix and resubmit →
              </Link>
            </p>
          </div>
        ) : isPending ? (
          <div className="card-print-hide mt-5 flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <p className="leading-relaxed">
              Your KYC is submitted — your card unlocks as soon as an admin approves it.
            </p>
          </div>
        ) : (
          !isRegistered && (
            <div className="card-print-hide mt-5 flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <p className="leading-relaxed">
                Your ID card is locked — finish registration to activate it and unlock sponsor
                benefits.{" "}
                <Link
                  href={registrationHref}
                  className="font-semibold text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
                >
                  Finish now →
                </Link>
              </p>
            </div>
          )
        )}

        {/* Member Card Viewer (Option B Two-Sided & Option A Single Badge) */}
        <div className="mt-6">
          <MemberCardViewer
            memberId={memberId}
            fullName={fullName}
            role={profile.role}
            city={profile.city ?? "Warangal"}
            avatarUrl={profile.avatar_url}
            createdAt={profile.created_at}
            isRegistered={isRegistered}
            isRejected={isRejected}
            isPending={isPending}
            bikeModel={rd?.bike_model}
            bikeRegNo={rd?.bike_reg_no}
            bloodGroup={rd?.blood_group}
            emergencyContactName={rd?.emergency_contact_name}
            emergencyContactPhone={rd?.emergency_contact_phone}
            emergencyContactRelation={rd?.emergency_contact_relation}
            verifyUrl={verifyUrl}
          />
        </div>

        {/* Locked state actions — hidden in print */}
        {!isRegistered && (
          <div className="card-print-hide mt-8 mx-auto max-w-sm rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
            <EmptyState
              title="Card locked"
              hint={
                isRejected
                  ? "Your KYC was sent back for fixes — update your details and resubmit."
                  : isPending
                    ? "Your KYC is with an admin for review — the card unlocks on approval."
                    : "Complete your rider registration to activate your ID card, QR code and sponsor benefits."
              }
              action={
                isPending ? undefined : (
                  <ButtonLink href={isRejected ? "/profile/kyc" : registrationHref} variant="primary" size="sm">
                    {isRejected ? "Fix and resubmit" : "Finish registration"}
                  </ButtonLink>
                )
              }
            />
          </div>
        )}
      </Container>
    </Section>
  );
}
