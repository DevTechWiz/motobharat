"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RideForm } from "./ride-form";
import { AdminSection } from "./admin-section";
import { GalleryManager } from "./[id]/edit/gallery-manager";
import { MembersPanel } from "./[id]/edit/members-panel";
import { createRide, updateRide } from "../actions";
import type { RideMember } from "@/lib/types";

interface RideEditorProps {
  initialRide?: {
    id: string;
    title: string;
    description: string;
    starts_at: string;
    meeting_point: string;
    destination?: string | null;
    itinerary?: { title: string; description?: string; activity?: string }[] | null;
    activities?: string[] | null;
    distance_km: number | null;
    difficulty: string | null;
    status: string;
    cover_url: string | null;
  } | null;
  initialPhotos?: { id: string; url: string; alt: string }[];
  initialMembers?: RideMember[];
}

export function RideEditor({
  initialRide,
  initialPhotos = [],
  initialMembers = [],
}: RideEditorProps) {
  const [createdRideId, setCreatedRideId] = useState<string | null>(initialRide?.id ?? null);

  const rideId = createdRideId;

  const handleCreated = (newId: string) => {
    setCreatedRideId(newId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/admin/rides/${newId}/edit`);
    }
  };

  return (
    <div className="space-y-10">
      <Link
        href="/admin/rides"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to rides
      </Link>

      <AdminSection num="01" title="Ride details" hint="Title, schedule, itinerary, cover photo and status">
        <RideForm
          ride={initialRide ?? (rideId ? { id: rideId, cover_url: null } : undefined)}
          action={rideId ? updateRide.bind(null, rideId) : createRide}
          onCreated={handleCreated}
        />
      </AdminSection>

      <AdminSection num="02" title="Gallery" hint="Memories from the road">
        <GalleryManager rideId={rideId} photos={initialPhotos} />
      </AdminSection>

      <AdminSection num="03" title="Members" hint="Who is on this column">
        <MembersPanel rideId={rideId} members={initialMembers} />
      </AdminSection>
    </div>
  );
}
