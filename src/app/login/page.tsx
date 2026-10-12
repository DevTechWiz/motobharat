import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { isPast } from "@/lib/format";
import { LoginForm, type LoginStats } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();

  const [{ data: events }, { count: riderCount }] = await Promise.all([
    supabase
      .from("events")
      .select("distance_km, starts_at")
      .eq("status", "published")
      .order("starts_at", { ascending: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const all = (events ?? []) as { distance_km: number | null; starts_at: string }[];
  const upcoming = all.filter((r) => !isPast(r.starts_at));
  const totalKm = all.reduce((sum, r) => sum + (r.distance_km ?? 0), 0);

  const stats: LoginStats = {
    riders: (riderCount ?? 0).toLocaleString("en-IN"),
    rides: upcoming.length.toLocaleString("en-IN"),
    km: Math.round(totalKm).toLocaleString("en-IN"),
  };

  return (
    <Suspense>
      <LoginForm stats={stats} />
    </Suspense>
  );
}
