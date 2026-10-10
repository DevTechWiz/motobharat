"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/ui/wordmark";
import { useAuth } from "@/lib/auth-context";
import { UserMenu } from "./user-menu";

const links = [
  { href: "/rides", label: "Rides" },
  { href: "/announcements", label: "Announcements" },
  { href: "/safety", label: "Safety" },
];

export function Topbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
          <img src="/brand/logo-128.png" alt="" className="size-11" />
          <Wordmark size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "shrink-0 border-b-2 py-1 text-sm font-medium transition-all",
                isActive(l.href)
                  ? "border-accent font-bold text-white"
                  : "border-transparent text-secondary hover:border-white/20 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 md:block">
          {user ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-[11px] font-bold tracking-wider text-accent-fg uppercase transition-colors hover:bg-accent-hover"
            >
              Join Us
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center text-secondary md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="rounded-b-2xl border-t border-border md:hidden">
          <nav className="flex flex-col px-4 pt-2" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-l-2 px-3 py-2.5 text-sm font-semibold",
                  isActive(l.href)
                    ? "border-accent bg-surface text-accent"
                    : "border-transparent text-secondary",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-4">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg border border-border-strong py-2.5 text-center text-[11px] font-bold tracking-wider uppercase hover:bg-surface"
                >
                  Profile
                </Link>
                {profile?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-border-strong py-2.5 text-center text-[11px] font-bold tracking-wider uppercase hover:bg-surface"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  className="block w-full py-2 text-center text-xs text-secondary hover:text-white"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border-strong py-2.5 text-center text-[11px] font-bold tracking-wider uppercase hover:bg-surface"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-accent py-2.5 text-center text-[11px] font-bold tracking-wider text-accent-fg uppercase hover:bg-accent-hover"
                >
                  Join Us
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
