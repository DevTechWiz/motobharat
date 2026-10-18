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

  const rows: [string, string][] = [
    ["Display name", profile.display_name],
    ["Full name (signature)", rd?.digital_signature ?? "—"],
    ["DL number (typed)", rd?.driving_licence ?? "—"],
    ["Plate number", rd?.bike_reg_no ?? "—"],
    ["Motorcycle", rd?.bike_model ?? "—"],
    ["Phone", rd?.phone ?? "—"],
    ["City", profile.city ?? "—"],
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

      <dl className="divide-y divide-border rounded-xl border border-border bg-surface">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-3 sm:px-4 py-2 sm:py-2.5">
            <dt className="text-[11px] sm:text-xs text-muted">{label}</dt>
            <dd className="text-right text-xs sm:text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <ApprovalButtons
        userId={id}
        approved={isRegistered}
        hasSubmission={isSubmitted}
      />

      <LockedFieldsForm
        userId={id}
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
