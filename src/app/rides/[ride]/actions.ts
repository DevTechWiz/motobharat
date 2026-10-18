"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RATE_LIMITS, rateLimit } from "@/lib/rateLimit";
import { isPast } from "@/lib/format";

export async function lookupPillionAction(pillionCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const clean = pillionCode.trim().toUpperCase();
  if (clean.length < 3) return { ok: false, error: "Enter at least 3 characters of Member ID" };

  const { data, error } = await supabase.rpc("lookup_pillion", { pillion_code: clean });
  if (error || !data || data.length === 0) {
    return { ok: false, error: "No registered pillion found with this Member ID." };
  }

  const pillion = data[0] as {
    id: string;
    display_name: string;
    full_name: string | null;
    avatar_url: string | null;
    blood_group: string | null;
  };

  if (pillion.id === user.id) {
    return { ok: false, error: "You cannot add yourself as a pillion." };
  }

  return { ok: true, pillion };
}

export async function joinRide(rideId: string, pillionCode?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!rateLimit("ride", user.id, RATE_LIMITS.rideJoinLeave)) {
    return { ok: false, error: "Too many attempts — try again later." };
  }

  const { data: rd } = await supabase
    .from("rider_details")
    .select("registered, member_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!rd?.registered) {
    return { ok: false, error: "Complete your registration first", needsKyc: true };
  }

  if (rd.member_type === "pillion") {
    return { ok: false, error: "Pillions must be added by their rider using their Member ID." };
  }

  const { data: ride } = await supabase
    .from("events")
    .select("status, starts_at, joining_paused, max_riders")
    .eq("id", rideId)
    .maybeSingle();
  if (!ride) return { ok: false, error: "Ride not found." };
  if (ride.status !== "published" || isPast(ride.starts_at)) {
    return { ok: false, error: "This ride is not open for joining." };
  }
  if (ride.joining_paused) {
    return { ok: false, error: "Registrations are closed for this ride.", paused: true };
  }

  let pillionUser: { id: string; display_name: string; full_name: string | null } | null = null;
  if (pillionCode && pillionCode.trim()) {
    const { data: lookupData, error: lookupErr } = await supabase.rpc("lookup_pillion", {
      pillion_code: pillionCode.trim().toUpperCase(),
    });
    if (lookupErr || !lookupData || lookupData.length === 0) {
      return { ok: false, error: "Pillion not found or not registered." };
    }
    const found = lookupData[0] as { id: string; display_name: string; full_name: string | null };
    if (found.id === user.id) {
      return { ok: false, error: "You cannot add yourself as a pillion." };
    }

    // Check if pillion is already joined to this ride
    const { data: existingPillion } = await supabase
      .from("event_members")
      .select("user_id")
      .eq("event_id", rideId)
      .eq("user_id", found.id)
      .maybeSingle();

    if (existingPillion) {
      return {
        ok: false,
        error: `${found.full_name || found.display_name} is already registered for this ride.`,
      };
    }
    pillionUser = found;
  }

  const spotsNeeded = pillionUser ? 2 : 1;
  if (ride.max_riders != null) {
    const { count } = await supabase
      .from("event_members")
      .select("*", { count: "exact", head: true })
      .eq("event_id", rideId);
    if (count != null && count + spotsNeeded > ride.max_riders) {
      return { ok: false, error: "Not enough spots available on this ride.", full: true };
    }
  }

  // Insert rider row
  const { error: riderErr } = await supabase
    .from("event_members")
    .insert({
      event_id: rideId,
      user_id: user.id,
      pillion_user_id: pillionUser ? pillionUser.id : null,
    });

  if (riderErr && riderErr.code !== "23505") return { ok: false, error: riderErr.message };

  // If pillion specified, insert pillion row
  if (pillionUser) {
    const { error: pillionErr } = await supabase
      .from("event_members")
      .insert({
        event_id: rideId,
        user_id: pillionUser.id,
        rider_user_id: user.id,
      });

    if (pillionErr && pillionErr.code !== "23505") {
      // rollback rider
      await supabase.from("event_members").delete().eq("event_id", rideId).eq("user_id", user.id);
      return { ok: false, error: pillionErr.message };
    }
  }

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  return { ok: true };
}

export async function leaveRide(rideId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!rateLimit("ride", user.id, RATE_LIMITS.rideJoinLeave)) {
    return { ok: false, error: "Too many attempts — try again later." };
  }

  // If rider had a pillion or was a rider, delete their row and any pillion row they brought
  const { error } = await supabase
    .from("event_members")
    .delete()
    .eq("event_id", rideId)
    .or(`user_id.eq.${user.id},rider_user_id.eq.${user.id}`);

  if (error) return { ok: false, error: error.message };

  // If the user leaving is a pillion leaving independently, unlink on rider's row
  await supabase
    .from("event_members")
    .update({ pillion_user_id: null })
    .eq("event_id", rideId)
    .eq("pillion_user_id", user.id);

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  return { ok: true };
}
