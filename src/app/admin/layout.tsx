import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/container";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Section spacing="compact">
      <Container>
        <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Organizer</p>
        <h1 className="mt-1 text-3xl font-extrabold">Admin</h1>
        <nav className="mt-4 flex gap-4 border-b border-border pb-3 text-sm font-semibold">
          <Link href="/admin" className="text-secondary hover:text-white">Overview</Link>
          <Link href="/admin/rides" className="text-secondary hover:text-white">Rides</Link>
          <Link href="/admin/announcements" className="text-secondary hover:text-white">Announcements</Link>
        </nav>
        <div className="mt-8">{children}</div>
      </Container>
    </Section>
  );
}
