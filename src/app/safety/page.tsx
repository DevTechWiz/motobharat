import { Container, Section } from "@/components/layout/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Shield, Users, AlertTriangle, Phone, BookOpen, Wrench, Check } from "lucide-react";

export const metadata = { title: "Safety Code" };

const principles = [
  {
    icon: Shield,
    title: "Gear Up Every Ride",
    body: "ISI-rated helmet, closed shoes, and riding gloves are mandatory. Elbow and knee pads recommended for long highway runs.",
  },
  {
    icon: Users,
    title: "Ride in Formation",
    body: "Staggered formation on highways, single file through traffic. Never split lanes as a group — ride single file in heavy traffic.",
  },
  {
    icon: AlertTriangle,
    title: "No Drink, No Dope",
    body: "Zero alcohol or substances before any community ride. If you are not fit to ride, do not ride. No exceptions.",
  },
  {
    icon: Phone,
    title: "Emergency Protocol",
    body: "Carry your phone charged. In case of an incident, call 112 first, then inform the ride lead. Do not move an injured rider.",
  },
  {
    icon: BookOpen,
    title: "Traffic Rules Apply",
    body: "All riders follow local traffic laws — signals, speed limits, and lane discipline. Community rides are not races.",
  },
  {
    icon: Wrench,
    title: "Bike Check Before Departure",
    body: "Check tyres, brakes, lights, and fluid levels before every ride. Ride leads may inspect bikes at the meeting point.",
  },
];

const checklist = [
  "ISI-rated helmet, strapped and ready",
  "Riding gloves and closed-shoe footwear on",
  "Valid driving licence and RC carried",
  "Tyres, brakes, lights and horn checked",
  "Fuel tank full, phone fully charged",
  "Water bottle packed for the route",
  "Ride lead briefed on the route and halt points",
  "Group chat notifications on for the ride day",
];

export default function SafetyPage() {
  return (
    <>
      <Section spacing="compact" border="bottom">
        <Container>
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Code</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">Safety Code</h1>
          <p className="mt-3 max-w-2xl text-secondary">
            Every rider agrees to this code before joining a community ride. Breaking it means
            sitting out the next ride — or permanently.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Non-negotiable"
            title="Ride Safe. Ride Smart. Ride Together."
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-accent/10">
                  <p.icon className="size-5 text-accent" aria-hidden />
                </div>
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-secondary">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section bg="surface">
        <Container>
          <SectionHeader
            eyebrow="Before you roll"
            title="Pre-Ride Checklist"
            cta={{ href: "/rides", label: "Find a Ride" }}
          />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg px-5 py-4"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/12">
                  <Check className="size-3.5 text-accent" aria-hidden />
                </span>
                <span className="text-sm text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section bg="surface" border="both">
        <Container className="max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold">Emergency Numbers</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[
              { label: "Ambulance", num: "108" },
              { label: "Police", num: "100" },
              { label: "Fire", num: "101" },
              { label: "Roadside / All-in-One", num: "112" },
            ].map((e) => (
              <a
                key={e.num}
                href={`tel:${e.num}`}
                className="group min-w-36 rounded-xl border border-border bg-surface-2 px-6 py-4 transition-all hover:border-accent hover:bg-surface-3 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Phone className="size-3 text-muted group-hover:text-accent transition-colors" />
                  <span className="font-mono text-[9px] font-bold text-accent/80 tracking-widest uppercase">
                    Tap to call
                  </span>
                </div>
                <p className="font-mono text-2xl font-bold text-accent tabular-nums">{e.num}</p>
                <p className="mt-1 text-xs text-muted">{e.label}</p>
              </a>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
