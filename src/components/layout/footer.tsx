"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShieldCheck, Mail, Phone } from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { scrollToTop } from "@/lib/scroll";

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

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const columns = [
  {
    heading: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/rides", label: "Rides" },
      { href: "/stories", label: "Stories & Achievements" },
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
      <p className="mt-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
        {children}
      </p>
    </div>
  );
}

function FooterNav({
  col,
  pathname,
}: {
  col: (typeof columns)[number];
  pathname: string;
}) {
  return (
    <nav aria-label={col.heading}>
      <ColumnHeading>{col.heading}</ColumnHeading>
      <ul className="mt-2 sm:mt-3 flex flex-col gap-0.5 sm:gap-2.5">
        {col.links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={(e) => {
                if (l.href === pathname) {
                  e.preventDefault();
                  scrollToTop();
                }
              }}
              className="inline-flex items-center py-1.5 text-xs sm:text-sm text-secondary transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <footer className="relative overflow-hidden border-t border-border bg-bg">
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.9fr_1.3fr_1.1fr]">
          <div className="max-w-sm space-y-3 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  scrollToTop();
                }
              }}
              className="inline-flex items-center gap-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
              <img src="/brand/logo-512.png" alt="" className="size-9 sm:size-14" />
              <Wordmark size="lg" />
            </Link>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
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

          <div className="grid grid-cols-2 gap-6 sm:contents">
            <FooterNav col={columns[0]} pathname={pathname} />
            <FooterNav col={columns[1]} pathname={pathname} />

            <div>
              <ColumnHeading>Contact Us</ColumnHeading>
              <ul className="mt-2 sm:mt-3 flex flex-col gap-2.5 text-xs sm:text-sm">
                <li>
                  <a
                    href="mailto:motobharat1@gmail.com"
                    className="inline-flex items-center gap-2 text-secondary transition-colors hover:text-accent group"
                  >
                    <Mail className="size-3.5 text-accent shrink-0 group-hover:scale-110 transition-transform" aria-hidden />
                    <span className="break-all">motobharat1@gmail.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919866777092"
                    className="inline-flex items-center gap-2 text-secondary transition-colors hover:text-accent font-mono group"
                  >
                    <Phone className="size-3.5 text-accent shrink-0 group-hover:scale-110 transition-transform" aria-hidden />
                    <span>+91 98667 77092</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919866777192"
                    className="inline-flex items-center gap-2 text-secondary transition-colors hover:text-accent font-mono group"
                  >
                    <Phone className="size-3.5 text-accent shrink-0 group-hover:scale-110 transition-transform" aria-hidden />
                    <span>+91 98667 77192</span>
                  </a>
                </li>
                <li className="inline-flex items-center gap-2 text-muted text-xs">
                  <MapPin className="size-3.5 text-accent/70 shrink-0" aria-hidden />
                  <span>Warangal, Telangana</span>
                </li>
              </ul>
            </div>

            <div>
              <ColumnHeading>Follow</ColumnHeading>
              <div className="mt-2 sm:mt-3 flex flex-col items-start gap-2">
                <a
                  href="https://instagram.com/motobharat_warangal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[34px] sm:min-h-[44px] items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-accent text-[11px] sm:text-xs font-semibold text-text transition-colors"
                >
                  <InstagramIcon className="size-3.5 sm:size-4" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.youtube.com/channel/UCxhlcz800JsNwqxmYqOn-EQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[34px] sm:min-h-[44px] items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-accent text-[11px] sm:text-xs font-semibold text-text transition-colors"
                >
                  <YouTubeIcon className="size-3.5 sm:size-4" />
                  <span>YouTube</span>
                </a>
                <a
                  href="https://chat.whatsapp.com/EKzCHnJcsDIHp3Y6RDLhNd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[34px] sm:min-h-[44px] items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-accent text-[11px] sm:text-xs font-semibold text-text transition-colors"
                >
                  <WhatsAppIcon className="size-3.5 sm:size-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border">
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-full h-auto w-full select-none"
          viewBox="0 0 1000 150"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
        >
          <defs>
            <linearGradient id="footer-watermark-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.07" />
            </linearGradient>
          </defs>
          <text
            x="500"
            y="150"
            textAnchor="middle"
            textLength="980"
            lengthAdjust="spacingAndGlyphs"
            fill="url(#footer-watermark-fade)"
            className="font-display"
            fontSize="150"
            fontWeight="900"
            letterSpacing="-2"
          >
            MOTOBHARAT
          </text>
        </svg>
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2.5 sm:py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            © {YEAR} MotoBharat - Warangal · All rights reserved
          </p>
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Ride with discipline. Arrive with respect.
          </p>
        </div>
      </div>
    </footer>
  );
}

