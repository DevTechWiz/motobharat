import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="space-y-10">
      <Link
        href="/admin/rides"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to rides
      </Link>
      <AdminSection num="01" title="Ride details" hint="Title, schedule, meeting point and status">
        <RideForm ride={ride} action={updateRide.bind(null, ride.id)} />
      </AdminSection>
      <AdminSection num="02" title="Cover photo" hint="The face of this ride across the site">
        <CoverUpload rideId={ride.id} coverUrl={ride.cover_url} />
      </AdminSection>
      <AdminSection num="03" title="Gallery" hint="Memories from the road">
        <GalleryManager rideId={ride.id} photos={photos} />
      </AdminSection>
      <AdminSection num="04" title="Members" hint="Who is on this column">
        <MembersPanel rideId={ride.id} members={membersWithDetails as RideMember[]} />
      </AdminSection>
    </div>
  );
}

function AdminSection({
  num,
  title,
  hint,
  children,
}: {
  num: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-7">
      <div className="mb-6 flex items-baseline gap-3 border-b border-border pb-4">
        <span className="font-mono text-xs font-bold text-accent">{num}</span>
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="hidden font-mono text-[10px] tracking-wider text-muted uppercase sm:inline">
          · {hint}
        </span>
      </div>
      {children}
    </section>
  );
}
