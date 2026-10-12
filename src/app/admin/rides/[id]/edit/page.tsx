import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RideForm } from "../../ride-form";
import { updateRide } from "../../../actions";
import { CoverUpload } from "./cover-upload";
import { GalleryManager } from "./gallery-manager";
import { MembersPanel } from "./members-panel";
import type { GalleryItem, RideMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditRidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ride } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!ride) notFound();

  const [{ data: members }, { data: media }] = await Promise.all([
    supabase
      .from("event_members")
      .select("*, profile:profiles(id, display_name, avatar_url)")
      .eq("event_id", id)
      .order("created_at"),
    supabase
      .from("gallery")
      .select("*")
      .eq("event_id", id)
      .order("created_at"),
  ]);

  // Admin-only: attach safety details (blood group + emergency contact) per rider.
  const memberIds = (members ?? []).map((m) => m.user_id);
  let detailsRows: {
    user_id: string;
    blood_group: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
    bike_model: string | null;
    bike_reg_no: string | null;
    gear_level: "helmet_only" | "basic" | "full_armored" | null;
    experience_level: "beginner" | "intermediate" | "experienced" | null;
  }[] = [];
  if (memberIds.length) {
    const { data } = await supabase
      .from("rider_details")
      .select("user_id, blood_group, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, bike_model, bike_reg_no, gear_level, experience_level")
      .in("user_id", memberIds);
    detailsRows = data ?? [];
  }
  const detailsByUser = new Map(detailsRows.map((d) => [d.user_id, d]));
  const membersWithDetails = (members ?? []).map((m) => ({
    ...m,
    details: detailsByUser.get(m.user_id) ?? null,
  }));

  const photos = ((media ?? []) as GalleryItem[]).map((m) => ({
    id: m.id,
    url: m.url,
    alt: m.alt,
  }));

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-6 text-lg font-bold">Edit Ride</h2>
        <RideForm ride={ride} action={updateRide.bind(null, ride.id)} />
      </section>
      <div className="border-t border-border pt-10">
        <CoverUpload rideId={ride.id} coverUrl={ride.cover_url} />
      </div>
      <div className="border-t border-border pt-10">
        <GalleryManager rideId={ride.id} photos={photos} />
      </div>
      <div className="border-t border-border pt-10">
        <MembersPanel rideId={ride.id} members={membersWithDetails as RideMember[]} />
      </div>
    </div>
  );
}
