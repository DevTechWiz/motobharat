"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RATE_LIMITS, rateLimit } from "@/lib/rateLimit";

export async function joinRide(rideId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!rateLimit("ride", user.id, RATE_LIMITS.rideJoinLeave)) {
    return { ok: false, error: "Too many attempts — try again later." };
  }

  const { data: rd } = await supabase
    .from("rider_details")
    .select("registered")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!rd?.registered) {
    return { ok: false, error: "Complete your rider KYC first", needsKyc: true };
  }

  const { error } = await supabase
    .from("event_members")
    .insert({ event_id: rideId, user_id: user.id });

  if (error && error.code !== "23505") return { ok: false, error: error.message };

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

  const { error } = await supabase
    .from("event_members")
    .delete()
    .eq("event_id", rideId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  return { ok: true };
}
