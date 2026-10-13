import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/format";
import { SITE_BASE, memberIdFromUserId, verifyUrlForUser } from "@/lib/member-card";
import { CardQr } from "./card-qr";

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
    .select("display_name, avatar_url, city, created_at")
    .eq("id", user.id)
    .single();

  const { data: rd } = await supabase
    .from("rider_details")
    .select("registered, age, gender, phone, bike_model, bike_reg_no, blood_group, experience_level, digital_signature, kyc_submitted_at, kyc_rejected")
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
      <Container className="max-w-3xl">
        <Link
          href="/profile"
          className="card-print-hide inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to profile
        </Link>

        <p className="card-print-hide mt-6 font-mono text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
          Member ID Card
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

        {/* The card */}
        <div className="card-print-area relative mt-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/10 blur-[90px]"
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/brand/logo-128.png"
                  alt="MotoBharat emblem"
                  width={40}
                  height={40}
                  className="size-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-extrabold tracking-tight text-white">MOTOBHARAT</p>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                    Warangal Riders
                  </p>
                </div>
              </div>
              <p className="font-mono text-sm font-bold tracking-widest text-accent">{memberId}</p>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <Avatar src={profile.avatar_url} name={fullName} size="xl" />
              <div className="min-w-0">
                <p className="truncate text-xl font-extrabold tracking-tight text-white">
                  {fullName}
                </p>
                <p className="mt-0.5 text-sm text-secondary">
                  {profile.city ?? "Warangal"} · Member since {formatDate(profile.created_at)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isRegistered ? (
                    <Badge tone="easy">
                      <ShieldCheck className="size-3" aria-hidden /> Registered
                    </Badge>
                  ) : (
                    <>
                      <Badge tone={isRejected ? "danger" : "moderate"}>
                        {isRejected ? "KYC Rejected" : isPending ? "Approval Pending" : "KYC Pending"}
                      </Badge>
                      <Badge tone="danger">
                        <Lock className="size-3" aria-hidden /> Card Locked
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/70 pt-4 text-xs">
              <div>
                <span className="block font-mono text-[10px] text-muted uppercase">Machine</span>
                <span className="block truncate font-semibold text-text">
                  {isRegistered ? rd?.bike_model || "—" : "•••"}
                </span>
              </div>
              <div>
                <span className="block font-mono text-[10px] text-muted uppercase">Plate No.</span>
                <span className="block font-mono font-bold uppercase text-text">
                  {isRegistered ? rd?.bike_reg_no || "—" : "•••"}
                </span>
              </div>
              <div>
                <span className="block font-mono text-[10px] text-muted uppercase">Blood Group</span>
                <span className="block font-bold text-text">
                  {isRegistered ? rd?.blood_group || "—" : "•••"}
                </span>
              </div>
            </div>

            <p className="mt-4 font-mono text-[10px] tracking-wider text-muted uppercase">
              Scan the QR to verify · motobharat.co
            </p>
          </div>
        </div>

        {/* Actions — hidden in print */}
        <div className="card-print-hide mt-8">
          {isRegistered ? (
            <>
              <CardQr verifyUrl={verifyUrl} memberId={memberId} />
              <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-relaxed text-muted">
                Show this QR at partner outlets — it opens your public verification page with your
                photo, name and active status. Nothing else is shared.
              </p>
            </>
          ) : (
            <div className="mx-auto max-w-sm rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
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
        </div>
      </Container>
    </Section>
  );
}
