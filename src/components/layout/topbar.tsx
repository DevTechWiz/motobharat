"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck, User as UserIcon, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/ui/wordmark";
import { Avatar } from "@/components/ui/avatar";
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
  const { user, profile, registered, signOut } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (pathname === "/login") return null;

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
        <div className="rounded-b-2xl border-t border-border bg-bg md:hidden animate-dropdown">
          <nav className="flex flex-col px-4 pt-2" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-l-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive(l.href)
                    ? "border-accent bg-surface text-accent"
                    : "border-transparent text-secondary hover:text-white hover:bg-surface/50",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-4">
            {user && profile ? (
              <div className="space-y-3">
                {/* Mobile User Card */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
                  <div className="relative">
                    <Avatar
                      name={profile.display_name}
                      src={profile.avatar_url}
                      size="md"
                      className="size-11 text-xs"
                    />
                    {registered ? (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-surface-2"
                        title="Verified Rider"
                      />
                    ) : (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-accent ring-2 ring-surface-2"
                        title="KYC Pending"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-text">{profile.display_name}</p>
                      {profile.role === "admin" && (
                        <span className="rounded bg-orange/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-orange border border-orange/30">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted">
                      {user.email || (profile.city ? `${profile.city}, TS` : "Warangal Rider")}
                    </p>
                    <div className="mt-1 flex items-center">
                      {registered ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-success border border-success/30">
                          <span className="size-1.5 rounded-full bg-success animate-pulse" />
                          Verified Rider
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-accent border border-accent/30">
                          <span className="size-1.5 rounded-full bg-accent" />
                          KYC Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Nav Links */}
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2"
                  >
                    <div className="rounded-md bg-surface-2 p-1.5 text-muted border border-border/60">
                      <UserIcon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>Rider Profile</span>
                      <span className="text-[10px] font-normal text-muted">Activity, rides & stats</span>
                    </div>
                  </Link>

                  <Link
                    href="/profile/kyc"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-surface-2 p-1.5 text-muted border border-border/60">
                        <ShieldCheck className={cn("size-4", registered ? "text-success" : "text-accent")} />
                      </div>
                      <div className="flex flex-col">
                        <span>Safety & KYC</span>
                        <span className="text-[10px] font-normal text-muted">Bike, licence & safety waiver</span>
                      </div>
                    </div>
                    {registered ? (
                      <span className="rounded bg-success/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-success border border-success/20">
                        Done
                      </span>
                    ) : (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                        Pending
                      </span>
                    )}
                  </Link>

                  {profile.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2"
                    >
                      <div className="rounded-md bg-surface-2 p-1.5 text-orange border border-border/60">
                        <Settings className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span>Admin Panel</span>
                        <span className="text-[10px] font-normal text-muted">Rides, members & notices</span>
                      </div>
                    </Link>
                  )}
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger/10 py-2.5 text-xs font-bold uppercase tracking-wider text-danger transition-colors hover:bg-danger/20"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              </div>
            ) : user ? (
              <div className="space-y-2">
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
