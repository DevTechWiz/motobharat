import { createClient } from "@/lib/supabase/server";
import { Container, Section } from "@/components/layout/container";
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
  const completed = all.filter(
    (r) => r.status === "completed" || (r.status === "published" && isPast(r.starts_at)),
  );
  const totalKm = all.reduce((sum, r) => sum + (r.distance_km ?? 0), 0);

  const facts = [
    { value: all.length.toLocaleString("en-IN"), label: "Rides Logged" },
    { value: upcoming.length.toLocaleString("en-IN"), label: "Upcoming" },
    { value: completed.length.toLocaleString("en-IN"), label: "Completed" },
    { value: totalKm.toLocaleString("en-IN"), label: "Kilometres" },
  ];

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

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-border bg-surface px-4 py-3.5"
              >
                <span className="block font-mono text-2xl font-bold text-white tabular-nums">
                  {f.value}
                </span>
                <span
                  className="mt-2 block h-px w-6 bg-accent/70"
                  aria-hidden
                />
                <span className="mt-2 block font-mono text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <RidesExplorer rides={all} />
        </Container>
      </Section>
    </>
  );
}
