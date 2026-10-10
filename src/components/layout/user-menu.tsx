"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";

export function UserMenu() {
  const { profile, registered, signOut } = useAuth();
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
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-2"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={profile.display_name} src={profile.avatar_url} size="sm" className="size-6 text-[10px]" />
        <span className="max-w-24 truncate">{profile.display_name.split(" ")[0]}</span>
        <ChevronDown className="size-3 text-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-border-strong bg-surface-3 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          <Link
            href="/profile"
            role="menuitem"
            className="block px-4 py-2.5 text-sm transition-colors hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/profile/kyc"
            role="menuitem"
            className="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            <span>Rider KYC</span>
            {registered ? (
              <ShieldCheck className="size-3.5 text-accent" aria-label="Registered" />
            ) : (
              <ShieldAlert className="size-3.5 text-danger" aria-label="Incomplete" />
            )}
          </Link>
          {profile.role === "admin" && (
            <Link
              href="/admin"
              role="menuitem"
              className="block px-4 py-2.5 text-sm transition-colors hover:bg-surface-2"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-surface-2"
            onClick={() => {
              signOut();
              setOpen(false);
            }}
          >
            <LogOut className="size-3.5" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
