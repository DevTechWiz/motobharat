import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/container";
import { AdminTabs } from "./admin-tabs";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Section spacing="compact">
      <Container>
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg border border-orange/30 bg-orange/10 p-1.5 text-orange">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Organizer</p>
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Admin</h1>
        <div className="mt-5">
          <AdminTabs />
        </div>
        <div className="mt-8">{children}</div>
      </Container>
    </Section>
  );
}
