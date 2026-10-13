"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RideForm } from "../ride-form";
import { AdminSection } from "../admin-section";
import { CoverUpload } from "../[id]/edit/cover-upload";
import { GalleryManager } from "../[id]/edit/gallery-manager";
import { MembersPanel } from "../[id]/edit/members-panel";
import { createRide } from "../../actions";

// One page for new and existing rides: the full details form first, then the
// identical 02 cover, 03 gallery and 04 members sections against the new row.
export default function NewRidePage() {
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/rides"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to rides
      </Link>
      <h2 className="text-lg font-bold">New Ride</h2>
      {!createdId ? (
        <RideForm action={createRide} onCreated={setCreatedId} />
      ) : (
        <div className="space-y-10">
          <AdminSection num="02" title="Cover photo" hint="The face of this ride across the site">
            <CoverUpload rideId={createdId} coverUrl={null} />
          </AdminSection>
          <AdminSection num="03" title="Gallery" hint="Memories from the road">
            <GalleryManager rideId={createdId} photos={[]} />
          </AdminSection>
          <AdminSection num="04" title="Members" hint="Who is on this column">
            <MembersPanel rideId={createdId} members={[]} />
          </AdminSection>
        </div>
      )}
    </div>
  );
}
