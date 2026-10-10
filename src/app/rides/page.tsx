import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
import { RidesExplorer } from "./rides-explorer";
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

  return (
    <>
      <Section spacing="compact" border="bottom">
        <Container>
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Departures</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">All Rides</h1>
          <p className="mt-3 max-w-2xl text-secondary">
            Curated single-day dawn sprints and multi-day expeditions departing from Warangal.
            Filter by tab, title, or difficulty.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <RidesExplorer rides={(rides ?? []) as Ride[]} />
        </Container>
      </Section>
    </>
  );
}
