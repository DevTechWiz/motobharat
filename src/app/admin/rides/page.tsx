import { createClient } from "@/lib/supabase/server";
import { RidesTable } from "./rides-table";
import type { Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRidesPage() {
  const supabase = await createClient();

  // Transition past published departures to completed in the database
  await supabase
    .from("events")
    .update({ status: "completed" })
    .eq("status", "published")
    .lt("starts_at", new Date().toISOString());

  const { data: rides } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  return <RidesTable rides={(rides ?? []) as Ride[]} />;
}
