import { Container, Section } from "@/components/layout/container";
import { PageMasthead } from "@/components/layout/page-masthead";
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
      <PageMasthead
        eyebrow="Code"
        title="Safety Code"
        lede="Every rider agrees to this code before joining a ride. Break it and you sit out."
      />

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Non-negotiable"
            title="Ride Safe. Ride Smart. Ride Together."
          />
          <div className="grid grid-cols-1 gap-3.5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((p) => (
              <div
                key={p.title}
                className="group rounded-xl border border-border bg-surface p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_20px_50px_-20px_rgba(245,158,11,0.4)]"
              >
                <div className="mb-3 sm:mb-4 flex size-9 sm:size-10 items-center justify-center rounded-lg bg-accent/10 transition-colors duration-300 group-hover:bg-accent/20">
                  <p.icon className="size-4.5 sm:size-5 text-accent" aria-hidden />
                </div>
                <h3 className="text-base sm:text-lg font-bold">{p.title}</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-secondary">{p.body}</p>
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
          <ul className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-border bg-bg px-3.5 py-3 sm:px-5 sm:py-4 transition-all duration-200 hover:border-accent/30 hover:bg-surface"
              >
                <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-accent/12">
                  <Check className="size-3 sm:size-3.5 text-accent" aria-hidden />
                </span>
                <span className="text-xs sm:text-sm text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section bg="surface" border="both">
        <Container className="max-w-2xl text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold">Emergency Numbers</h2>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2.5 sm:gap-4">
            {[
              { label: "Ambulance", num: "108" },
              { label: "Police", num: "100" },
              { label: "Fire", num: "101" },
              { label: "Roadside / All-in-One", num: "112" },
            ].map((e) => (
              <a
                key={e.num}
                href={`tel:${e.num}`}
                className="group flex-1 min-w-[130px] sm:min-w-36 rounded-xl border border-border bg-surface-2 px-4 py-3 sm:px-6 sm:py-4 transition-all hover:border-accent hover:bg-surface-3 active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Phone className="size-3 text-muted group-hover:text-accent transition-colors" />
                  <span className="font-mono text-[9px] font-bold text-accent/80 tracking-widest uppercase">
                    Tap to call
                  </span>
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-accent tabular-nums">{e.num}</p>
                <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-muted">{e.label}</p>
              </a>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
