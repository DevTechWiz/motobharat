import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

const YEAR = new Date().getFullYear();

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

const links = [
  { href: "/rides", label: "Rides" },
  { href: "/announcements", label: "Announcements" },
  { href: "/safety", label: "Safety" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
            <img src="/brand/logo-512.png" alt="" className="size-16" />
            <Wordmark size="lg" />
          </Link>
          <p className="text-sm text-secondary">Different Roads. One Community.</p>
          <p className="text-sm text-muted">Warangal, Telangana, India</p>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <nav className="flex flex-col gap-2.5" aria-label="Footer">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-secondary hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>
          <a
            href="https://instagram.com/motobharat_warangal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start text-sm text-secondary hover:text-accent"
          >
            <InstagramIcon className="size-4 text-accent" />
            <span>@motobharat_warangal</span>
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 font-mono text-[10px] tracking-wider text-muted uppercase sm:px-6 lg:px-8">
          © {YEAR} MotoBharat Warangal · Ride Safe
        </p>
      </div>
    </footer>
  );
}
