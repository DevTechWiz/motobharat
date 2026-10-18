"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ShieldAlert,
  Clock,
  IdCard,
  Megaphone,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

interface NoticeItem {
  id: string;
  slug: string;
  title: string;
  body: string;
  created_at: string;
}

export function NotificationsMenu() {
  const { user, registered, approval, memberType } = useAuth();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isNewlyApproved, setIsNewlyApproved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch recent community announcements
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("announcements")
      .select("id, slug, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(2)
      .then(({ data }) => {
        if (data) {
          setNotices(data as NoticeItem[]);
        }
      });
  }, []);

  // Determine if there is an unread or actionable notification
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const storageKey = `motobharat_notifications_seen_${user?.id ?? "guest"}`;
      const lastSeen = window.localStorage.getItem(storageKey);

      // 1. If KYC is approved, check if the user has seen their approval celebration
      if (user && (approval === "approved" || registered)) {
        const approvedSeenKey = `motobharat_seen_approved_${user.id}`;
        const hasSeenApproved = window.localStorage.getItem(approvedSeenKey);
        if (!hasSeenApproved) {
          setIsNewlyApproved(true);
          setHasUnread(true);
          return;
        }
      }
      setIsNewlyApproved(false);

      // 2. If KYC needs action (rejected or incomplete) or pending, highlight the bell
      if (approval === "rejected" || approval === "needs-kyc" || approval === "pending") {
        setHasUnread(true);
        return;
      }

      // 3. Check if the latest announcement was published after last seen
      if (notices.length > 0) {
        const latestNoticeTime = new Date(notices[0].created_at).getTime();
        if (!lastSeen || latestNoticeTime > Number(lastSeen)) {
          setHasUnread(true);
          return;
        }
      }

      setHasUnread(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [user, approval, registered, notices]);

  const handleOpenToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined") {
        // Mark notifications as acknowledged when opened
        const storageKey = `motobharat_notifications_seen_${user?.id ?? "guest"}`;
        window.localStorage.setItem(storageKey, String(Date.now()));
        if (user && (approval === "approved" || registered)) {
          window.localStorage.setItem(`motobharat_seen_approved_${user.id}`, "true");
        }
        setHasUnread(false);
      }
      return next;
    });
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleOpenToggle}
        className={cn(
          "group relative flex size-9 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer",
          open
            ? "border-accent bg-accent/20 text-accent shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-2 ring-accent/40"
            : "border-border/80 bg-surface-2/60 text-secondary hover:border-accent/60 hover:text-white hover:bg-surface-3"
        )}
      >
        <Bell className="size-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />

        {/* Pulsing indicator badge for unread notifications */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                isNewlyApproved ? "bg-emerald-400" : "bg-accent"
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full",
                isNewlyApproved
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  : "bg-accent shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              )}
            />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2.5 w-[320px] sm:w-[380px] rounded-2xl border border-border bg-surface-2/95 p-3 sm:p-4 shadow-[0_16px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-dropdown origin-top-right text-text"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border bg-surface p-1 text-accent">
                <Bell className="size-3.5" aria-hidden />
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight">Notifications</h3>
            </div>
            <Link
              href="/announcements"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              All Notices →
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto overscroll-contain pr-1">
            {/* 1. KYC / Membership Status Notification */}
            {user ? (
              registered ? (
                <div
                  className={cn(
                    "rounded-xl border p-3 space-y-1.5 transition-colors",
                    isNewlyApproved
                      ? "border-emerald-500/50 bg-emerald-500/15 ring-1 ring-emerald-500/30"
                      : "border-emerald-500/30 bg-emerald-500/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <ShieldCheck className="size-4 shrink-0" />
                      <span>{isNewlyApproved ? "🎉 KYC Approved! Welcome to the Pack" : "KYC Verified & Approved"}</span>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30 shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    Your {memberType === "pillion" ? "Pillion" : "Rider"} membership is active. Your official Member ID card and ride bookings are unlocked.
                  </p>
                  <Link
                    href="/profile/card"
                    onClick={() => {
                      if (user && typeof window !== "undefined") {
                        window.localStorage.setItem(`motobharat_seen_approved_${user.id}`, "true");
                      }
                      setOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <IdCard className="size-3.5" />
                    <span>View Digital ID Card</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              ) : approval === "rejected" ? (
                <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-danger font-bold text-xs">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>KYC Corrections Needed</span>
                    </div>
                    <span className="rounded bg-danger/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-danger border border-danger/30 shrink-0">
                      Action Required
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    An admin reviewed your KYC and requested changes. Click below to view the reviewer notes and resubmit your details.
                  </p>
                  <Link
                    href="/profile/kyc"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-bold text-danger hover:text-danger/80 transition-colors"
                  >
                    <span>Fix KYC Details</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              ) : approval === "pending" ? (
                <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-accent font-bold text-xs">
                      <Clock className="size-4 shrink-0" />
                      <span>KYC Under Review</span>
                    </div>
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/30 shrink-0">
                      In Queue
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    Your application has been received and is currently in the verification queue. Admin approval will unlock your official ID card.
                  </p>
                  <Link
                    href="/profile/kyc"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-bold text-accent hover:text-accent-hover transition-colors"
                  >
                    <span>View Submitted Form</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-accent/40 bg-accent/5 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-accent font-bold text-xs">
                      <Sparkles className="size-4 shrink-0" />
                      <span>Complete Registration</span>
                    </div>
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/30 shrink-0">
                      Step Needed
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    Finish your personal details, safety contacts, and waiver to activate your membership card and join community rides.
                  </p>
                  <Link
                    href="/profile/kyc"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-bold text-accent hover:text-accent-hover transition-colors"
                  >
                    <span>Complete KYC Now</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
                <p className="text-xs font-bold text-text">Welcome to MotoBharat</p>
                <p className="text-[11px] text-secondary leading-relaxed">
                  Sign in with Google to receive real-time notifications about your KYC approval, ride confirmations, and community updates.
                </p>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-bold text-accent hover:text-accent-hover transition-colors"
                >
                  <span>Sign In</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            )}

            {/* 2. Latest Community Announcements */}
            {notices.length > 0 ? (
              notices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/announcements/${notice.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl border border-border/80 bg-surface/70 p-3 space-y-1 transition-all duration-200 hover:border-accent/40 hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-text truncate">
                      <Megaphone className="size-3.5 text-accent shrink-0" />
                      <span className="truncate">{notice.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted shrink-0">
                      {new Date(notice.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary line-clamp-2 leading-relaxed">
                    {notice.body}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-border/60 bg-surface/40 p-3 text-center text-[11px] text-muted">
                No new community notices posted.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/80 pt-2.5 mt-3 flex items-center justify-between text-[11px] text-muted">
            <span>MotoBharat Alerts</span>
            <Link
              href="/safety"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-accent transition-colors"
            >
              Safety Code
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
