"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, ShieldAlert, ShieldCheck, User as UserIcon, Settings, IdCard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export function UserMenu() {
  const { user, profile, registered, approval, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!profile) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Account: ${profile.display_name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex rounded-full p-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          open ? "ring-2 ring-accent" : "ring-1 ring-border hover:ring-accent/60"
        )}
      >
        <Avatar
          name={profile.display_name}
          src={profile.avatar_url}
          size="md"
          className="text-xs"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-surface-2 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-dropdown origin-top-right"
        >
          {/* User Profile Card Header */}
          <div className="flex items-center gap-3 border-b border-border/80 px-3 py-3 mb-1">
            <Avatar
              name={profile.display_name}
              src={profile.avatar_url}
              size="md"
              className="size-10 shrink-0 text-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-text">{profile.display_name}</p>
                {profile.role === "admin" && (
                  <span className="rounded bg-orange/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-orange border border-orange/30">
                    Admin
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-muted mt-0.5">
                {user?.email || (profile.city ? `${profile.city}, TS` : "Warangal Rider")}
              </p>
              <div className="mt-1.5 flex items-center">
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

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <Link
              href="/profile"
              role="menuitem"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-3 hover:text-text"
              onClick={() => setOpen(false)}
            >
              <div className="rounded-md bg-surface p-1.5 text-muted border border-border/60">
                <UserIcon className="size-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-text font-semibold">Rider Profile</span>
                <span className="text-[10px] text-muted">Activity, rides & stats</span>
              </div>
            </Link>

            <Link
              href="/profile/kyc"
              role="menuitem"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-3 hover:text-text"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-surface p-1.5 text-muted border border-border/60">
                  <ShieldCheck className={cn("size-3.5", registered ? "text-success" : "text-accent")} />
                </div>
                <div className="flex flex-col">
                  <span className="text-text font-semibold">Safety & KYC</span>
                  <span className="text-[10px] text-muted">Bike, licence & safety waiver</span>
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
              role="menuitem"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-3 hover:text-text"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-surface p-1.5 text-muted border border-border/60">
                  <IdCard className={cn("size-3.5", registered ? "text-success" : "text-accent")} />
                </div>
                <div className="flex flex-col">
                  <span className="text-text font-semibold">Member ID Card</span>
                  <span className="text-[10px] text-muted">QR for partner benefits</span>
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
                role="menuitem"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-3 hover:text-text"
                onClick={() => setOpen(false)}
              >
                <div className="rounded-md bg-surface p-1.5 text-orange border border-border/60">
                  <Settings className="size-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text font-semibold">Admin Panel</span>
                  <span className="text-[10px] text-muted">Rides, members & notices</span>
                </div>
              </Link>
            )}
          </div>

          <div className="my-1 border-t border-border/80" />

          {/* Sign Out */}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-danger transition-colors hover:bg-danger/10"
            onClick={() => {
              signOut();
              setOpen(false);
            }}
          >
            <div className="rounded-md bg-danger/10 p-1.5 text-danger border border-danger/20">
              <LogOut className="size-3.5" aria-hidden />
            </div>
            <span className="font-semibold">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
