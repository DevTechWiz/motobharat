"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { RideForm } from "./ride-form";
import { Button } from "@/components/ui/button";
import { AdminSection } from "./admin-section";
import { RideImportDialog } from "./ride-import-dialog";
import type { RideImport, RideImportResult } from "@/lib/ride-import";
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
  const [importOpen, setImportOpen] = useState(false);
  const [imported, setImported] = useState<RideImport | null>(null);
  const [importKey, setImportKey] = useState(0);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const rideId = createdRideId;
  const isNew = !initialRide?.id && !rideId;

  const handleImported = (result: RideImportResult) => {
    setImported(result.values);
    setImportKey((k) => k + 1);
    const notes = [
      ...result.skipped.map((s) => `${s.field}: ${s.reason}`),
      ...result.ignored.map((k) => `ignored key: ${k}`),
    ];
    setImportSummary(
      `Filled ${result.filled.length === 0 ? "nothing" : result.filled.join(", ")}${notes.length > 0 ? ` — ${notes.join("; ")}` : ""}`
    );
    setImportOpen(false);
  };

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
        {isNew && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Add JSON
            </Button>
            {importSummary ? (
              <p className="text-xs text-secondary">{importSummary}</p>
            ) : (
              <p className="text-xs text-muted">Paste ride JSON to prefill this form.</p>
            )}
          </div>
        )}
        <RideForm
          key={`${rideId ?? "new"}-${importKey}`}
          ride={initialRide ?? (rideId ? { id: rideId, cover_url: null } : undefined)}
          imported={imported}
          action={rideId ? updateRide.bind(null, rideId) : createRide}
          onCreated={handleCreated}
        />
      </AdminSection>

      {isNew && importOpen && (
        <RideImportDialog
          open={importOpen}
          onApply={handleImported}
          onCancel={() => setImportOpen(false)}
        />
      )}

      <AdminSection num="02" title="Gallery" hint="Photos displayed in the ride gallery">
        <GalleryManager rideId={rideId} photos={initialPhotos} />
      </AdminSection>

      <AdminSection num="03" title="Members" hint="Who is on this column">
        <MembersPanel rideId={rideId} members={initialMembers} />
      </AdminSection>
    </div>
  );
}
