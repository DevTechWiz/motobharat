"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
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

const columns = [
  {
    heading: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/rides", label: "Rides" },
      { href: "/announcements", label: "Announcements" },
      { href: "/safety", label: "Safety Code" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <span className="block h-px w-6 bg-accent/70" aria-hidden />
      <p className="mt-3 font-mono text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
        {children}
      </p>
    </div>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
              <img src="/brand/logo-512.png" alt="" className="size-14" />
              <Wordmark size="lg" />
            </Link>
            <p className="text-sm text-secondary leading-relaxed">
              Different Roads. One Community. Warangal riders exploring India with discipline, safety, and camaraderie.
            </p>

            <div className="space-y-1.5 text-xs text-secondary">
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-accent shrink-0" aria-hidden />
                <span>Warangal, Telangana, India</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-accent shrink-0" aria-hidden />
                <span>Full Protective Gear Mandatory</span>
              </div>
            </div>

            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              Free to join · 18+ · Ride safe
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <ColumnHeading>{col.heading}</ColumnHeading>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-secondary transition-colors hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <ColumnHeading>Follow</ColumnHeading>
            <div className="mt-4">
              <a
                href="https://instagram.com/motobharat_warangal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-border hover:border-accent text-xs font-semibold text-text transition-colors"
              >
                <InstagramIcon className="size-4 text-accent" />
                <span className="text-accent">@motobharat_warangal</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            © {YEAR} MotoBharat (Warangal Chapter) · All rights reserved
          </p>
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Ride with discipline. Arrive with respect.
          </p>
        </div>
      </div>
    </footer>
  );
}

