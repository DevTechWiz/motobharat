"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ShieldAlert, ShieldCheck, User as UserIcon, LogOut, Settings, IdCard, ArrowRight, Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { scrollToTop } from "@/lib/scroll";
import { Wordmark } from "@/components/ui/wordmark";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, registered, approval, loading, refreshProfile, signOut } = useAuth();
  const isHome = pathname === "/";

  const links = [
    { href: "/rides", label: "Rides" },
    { href: "/stories", label: "Stories" },
    { href: "/gallery", label: "Gallery" },
    { href: "/about", label: "About Us" },
    { href: "/safety", label: "Safety" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Client auth state: re-sync on navigation and when the tab regains focus
  // only when a user session exists, avoiding redundant network traffic for guests.
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, [pathname, user, refreshProfile]);

  useEffect(() => {
    if (!user) return;

    const onFocus = () => refreshProfile();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshProfile();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // Poll while the tab is visible ONLY if a rider is actively awaiting KYC review
    let intervalId: number | null = null;
    if (approval === "pending") {
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") refreshProfile();
      }, 15000);
    }

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user, approval, refreshProfile]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (pathname === "/login") return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isHome
          ? scrolled
            ? "border-none bg-bg/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "border-none bg-black/10 backdrop-blur-sm -mb-14 sm:-mb-16"
          : scrolled
            ? "border-b border-border/70 bg-bg/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "border-b border-border/60 bg-bg/95"
      )}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              scrollToTop();
            }
          }}
          className="flex shrink-0 items-center py-2"
        >
          <Wordmark size="lg" className="h-7 sm:h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 lg:gap-9 md:flex" aria-label="Primary">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "group relative flex flex-col items-center py-1 text-xs font-semibold tracking-[0.2em] uppercase transition-colors duration-200",
                  active ? "text-white" : "text-white/80 hover:text-white"
                )}
              >
                <span>{l.label}</span>
                <span
                  className={cn(
                    "mt-1.5 h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-300",
                    active ? "w-full" : "w-0 group-hover:w-full"
                  )}
                  aria-hidden
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <Link
            href="/announcements"
            className={cn(
              "group relative flex size-9 items-center justify-center rounded-full border transition-all duration-200",
              isActive("/announcements")
                ? "border-accent bg-accent/20 text-accent shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                : "border-border/80 bg-surface-2/60 text-secondary hover:border-accent/60 hover:text-white hover:bg-surface-3"
            )}
            aria-label="Announcements"
            title="Announcements"
          >
            <Bell className="size-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
          </Link>

          {loading ? (
            <div className="h-8 w-24 rounded-full bg-white/5 animate-pulse border border-white/10" />
          ) : user ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full border border-accent/80 bg-accent/5 px-5 py-2 text-xs font-semibold tracking-wider text-accent uppercase backdrop-blur-sm transition-all duration-300 hover:border-accent hover:bg-accent hover:text-black hover:shadow-[0_0_24px_rgba(245,158,11,0.4)] active:scale-[0.97]"
            >
              <span>Join Us</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/announcements"
            className={cn(
              "flex size-9 items-center justify-center rounded-full border transition-colors",
              isActive("/announcements")
                ? "border-accent bg-accent/20 text-accent"
                : "border-border/80 bg-surface-2/60 text-secondary hover:text-white"
            )}
            aria-label="Announcements"
            title="Announcements"
          >
            <Bell className="size-4" aria-hidden />
          </Link>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center text-white/80 hover:text-white"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
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
                  "flex min-h-[44px] items-center border-l-2 px-3 py-2.5 text-sm font-semibold transition-colors",
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
                          <ShieldCheck className="size-3" aria-hidden />
                          Verified Rider
                        </span>
                      ) : approval === "rejected" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-danger border border-danger/30">
                          <ShieldAlert className="size-3" aria-hidden />
                          KYC Rejected
                        </span>
                      ) : approval === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-accent border border-accent/30">
                          <ShieldAlert className="size-3" aria-hidden />
                          Approval Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-accent border border-accent/30">
                          <ShieldAlert className="size-3" aria-hidden />
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
                    ) : approval === "rejected" ? (
                      <span className="rounded bg-danger/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-danger border border-danger/20">
                        Fix needed
                      </span>
                    ) : (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                        Pending
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile/card"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-surface-2 p-1.5 text-muted border border-border/60">
                        <IdCard className={cn("size-4", registered ? "text-success" : "text-accent")} />
                      </div>
                      <div className="flex flex-col">
                        <span>Member ID Card</span>
                        <span className="text-[10px] font-normal text-muted">QR for partner benefits</span>
                      </div>
                    </div>
                    {registered ? (
                      <span className="rounded bg-success/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-success border border-success/20">
                        Active
                      </span>
                    ) : (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                        Locked
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
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger/10 py-2.5 text-xs font-bold uppercase tracking-wider text-danger transition-colors hover:bg-danger/20"
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
            ) : loading ? (
              <div className="h-11 w-full rounded-full bg-white/5 animate-pulse border border-white/10" />
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-accent bg-accent/15 py-2.5 text-center text-xs font-semibold tracking-wider text-accent uppercase hover:bg-accent hover:text-black transition-colors"
              >
                Join Us
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
