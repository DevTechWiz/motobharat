import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { ZoomableImage } from "@/components/ui/image-lightbox";
import { ApprovalButtons } from "./approval-buttons";
import { LockedFieldsForm } from "./locked-fields-form";
import { ageFromDob } from "@/lib/format";
import { DlViewerCard } from "./dl-viewer";

export const dynamic = "force-dynamic";

// Admin safety view: rider details + licence photo (read-only), plus the
// membership approval verdict (photo vs typed name/number cross-check).
export default async function RiderReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: rd }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, city, role")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("rider_details").select("*").eq("user_id", id).maybeSingle(),
  ]);
  if (!profile) notFound();

  const isRegistered = Boolean(rd?.registered);
  const isSubmitted = Boolean(rd?.kyc_submitted_at);
  const isRejected = Boolean(rd?.kyc_rejected);
  const memberType = rd?.member_type ?? "rider";

  const genderLabels: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  };

  const experienceLabels: Record<string, string> = {
    beginner: "Beginner (< 1 yr)",
    intermediate: "Intermediate (1–3 yrs)",
    experienced: "Experienced (3+ yrs)",
  };

  const gearLabels: Record<string, string> = {
    full_armored: "Full Armored (Jacket + Pants + Boots)",
    basic: "Basic Gear",
    helmet_only: "Helmet Only",
  };

  const insuranceLabels: Record<string, string> = {
    valid_insured: "Valid & Insured",
    expired: "Expired",
    none: "None / Not Insured",
  };

  const age = rd?.age ?? (rd?.dob ? ageFromDob(rd.dob) : null);
  const dobText = rd?.dob
    ? `${rd.dob}${age ? ` (${age} yrs)` : ""}`
    : age
      ? `${age} yrs`
      : "—";

  const sections: {
    title: string;
    rows: [string, string][];
  }[] = [
    {
      title: "Personal & Contact",
      rows: [
        ["Display name", profile.display_name],
        ["City", profile.city ?? "—"],
        ["Date of birth & Age", dobText],
        ["Gender", (rd?.gender && genderLabels[rd.gender]) ?? rd?.gender ?? "—"],
        ["Occupation", rd?.occupation ?? "—"],
        ["Permanent address", rd?.permanent_address ?? "—"],
        ["Phone", rd?.phone ?? "—"],
        ["WhatsApp", rd?.whatsapp_number ?? rd?.phone ?? "—"],
        [
          "Instagram",
          rd?.instagram_handle
            ? `@${rd.instagram_handle.replace(/^@/, "")}`
            : "—",
        ],
      ],
    },
    {
      title: "Emergency & Medical",
      rows: [
        ["Blood group", rd?.blood_group ?? "—"],
        [
          "Emergency contact",
          rd?.emergency_contact_name
            ? `${rd.emergency_contact_name}${rd.emergency_contact_relation ? ` (${rd.emergency_contact_relation})` : ""}`
            : "—",
        ],
        ["Emergency phone", rd?.emergency_contact_phone ?? "—"],
        ["Secondary emergency phone", rd?.emergency_contact_2_phone ?? "—"],
        ["Medical conditions / Allergies", rd?.medical_conditions || "None reported"],
        [
          "Personal health insurance",
          rd?.personal_health_insurance ? "Yes (Active Mediclaim)" : "No",
        ],
      ],
    },
    {
      title: "Motorcycle & Safety Gear",
      rows: [
        ["Member type", memberType === "pillion" ? "Pillion Member" : "Rider"],
        ["Motorcycle", rd?.bike_model ?? (memberType === "pillion" ? "— (Pillion)" : "—")],
        ["Plate number", rd?.bike_reg_no ?? (memberType === "pillion" ? "— (Pillion)" : "—")],
        ["DL number (typed)", rd?.driving_licence ?? (memberType === "pillion" ? "— (Pillion)" : "—")],
        [
          "Vehicle insurance",
          (rd?.vehicle_insurance_status && insuranceLabels[rd.vehicle_insurance_status]) ??
            (memberType === "pillion" ? "— (Pillion)" : (rd?.vehicle_insurance_status ?? "—")),
        ],
        [
          "Riding experience",
          (rd?.experience_level && experienceLabels[rd.experience_level]) ??
            (memberType === "pillion" ? "— (Pillion)" : (rd?.experience_level ?? "—")),
        ],
        [
          "Riding gear level",
          (rd?.gear_level && gearLabels[rd.gear_level]) ?? rd?.gear_level ?? "—",
        ],
        ["Roadside assistance (RSA)", rd?.has_rsa ? "Yes (Active 24x7)" : "No"],
        ["Rides with pillion", rd?.rides_with_pillion ? "Frequently" : "No / Rare"],
      ],
    },
    {
      title: "Verification & Waiver",
      rows: [
        ["Full name (signature)", rd?.digital_signature ?? "—"],
        ["Safety waiver declaration", rd?.declaration_confirmed ? "Confirmed & Agreed" : "Not confirmed"],
        ["Referral source", rd?.referral_source ?? "—"],
        ["Suggestions / Feedback", rd?.suggestions ?? "—"],
        [
          "KYC submitted at",
          rd?.kyc_submitted_at
            ? new Date(rd.kyc_submitted_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—",
        ],
        ...(rd?.rejection_reason ? [["Rejection reason", rd.rejection_reason] as [string, string]] : []),
      ],
    },
  ];

  return (
    <div className="max-w-3xl space-y-4 sm:space-y-6">
      <Link
        href="/admin/riders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to riders
      </Link>

      <div className="flex items-center gap-3 sm:gap-4">
        <ZoomableImage
          src={profile.avatar_url}
          alt={profile.display_name}
          title={`Profile photo — ${profile.display_name}`}
        >
          <Avatar name={profile.display_name} src={profile.avatar_url} size="md" />
        </ZoomableImage>
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold">{profile.display_name}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5 sm:gap-2">
            <Badge tone={isRegistered ? "easy" : "moderate"}>
              {isRegistered ? "Registered" : "Incomplete"}
            </Badge>
            <Badge tone={memberType === "pillion" ? "moderate" : "neutral"}>
              {memberType === "pillion" ? "Pillion" : "Rider"}
            </Badge>
            {!isRegistered &&
              (isRejected ? (
                <Badge tone="danger">Rejected — fixes needed</Badge>
              ) : isSubmitted ? (
                <Badge tone="moderate">Pending review</Badge>
              ) : (
                <Badge tone="neutral">No KYC submitted yet</Badge>
              ))}
          </div>
        </div>
      </div>

      {!isRegistered && !isSubmitted && (
        <div className="rounded-xl border border-border bg-surface-2/60 p-3 sm:p-4 text-xs text-secondary leading-relaxed">
          <p className="font-semibold text-text">No KYC submission on file</p>
          <p className="mt-0.5 text-muted">
            This rider has created an account but has not submitted their registration details or driving licence yet.
          </p>
        </div>
      )}

      {rd?.dl_image_url ? (
        <DlViewerCard
          imageUrl={rd.dl_image_url}
          riderName={profile.display_name}
          dlNumber={rd.driving_licence}
        />
      ) : (
        <EmptyState
          title="No licence photo on file"
          hint={
            memberType === "pillion"
              ? "Pillion members are not required to upload a driving licence."
              : "The rider has not uploaded a licence photo yet."
          }
        />
      )}

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-surface-2/60 px-3 sm:px-4 py-2">
              <h3 className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.16em] text-accent uppercase">
                {section.title}
              </h3>
            </div>
            <dl className="divide-y divide-border">
              {section.rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-3 sm:px-4 py-2 sm:py-2.5">
                  <dt className="text-[11px] sm:text-xs text-muted shrink-0">{label}</dt>
                  <dd className="text-right text-xs sm:text-sm font-semibold break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <ApprovalButtons
        userId={id}
        approved={isRegistered}
        hasSubmission={isSubmitted}
      />

      <LockedFieldsForm
        userId={id}
        memberType={memberType}
        hasSubmission={Boolean(rd)}
        initial={{
          dob: rd?.dob ?? null,
          gender: rd?.gender ?? null,
          blood_group: rd?.blood_group ?? null,
          driving_licence: rd?.driving_licence ?? null,
          digital_signature: rd?.digital_signature ?? null,
        }}
      />
    </div>
  );
}
