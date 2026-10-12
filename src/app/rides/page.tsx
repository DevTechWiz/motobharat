import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { PageMasthead } from "@/components/layout/page-masthead";
import { RidesExplorer } from "./rides-explorer";
import { isPast } from "@/lib/format";
import type { Ride } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rides" };

export default async function RidesPage() {
  const supabase = await createClient();
  // Cancelled + completed rides are public too — they land in their own tabs.
  const { data: rides } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "completed", "cancelled"])
    .order("starts_at", { ascending: true });

  const all = (rides ?? []) as Ride[];
  const upcoming = all.filter((r) => r.status === "published" && !isPast(r.starts_at));

  return (
    <>
      <PageMasthead
        eyebrow="Departures"
        title="All Rides"
        meta={`${all.length} ${all.length === 1 ? "ride" : "rides"} · ${upcoming.length} upcoming`}
        lede="Single-day dawn sprints and multi-day expeditions from Warangal. Filter by tab, title, or difficulty."
      />

      <Section>
        <Container>
          <RidesExplorer rides={all} />
        </Container>
      </Section>
    </>
  );
}
