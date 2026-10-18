"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, Check, Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button, buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { memberIdFromUserId } from "@/lib/member-card";
import { joinRide, leaveRide, lookupPillionAction } from "./actions";

export function JoinLeaveButton({
  rideId,
  isMember,
  joiningPaused,
  isFull,
}: {
  rideId: string;
  isMember: boolean;
  joiningPaused: boolean;
  isFull: boolean;
}) {
  const { user, registered, approval, memberType, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState(isMember);
  const [error, setError] = useState<string | null>(null);

  // Rider bringing pillion state
  const [hasPillion, setHasPillion] = useState(false);
  const [pillionCode, setPillionCode] = useState("");
  const [pillionInfo, setPillionInfo] = useState<{
    id: string;
    display_name: string;
    full_name: string | null;
  } | null>(null);
  const [pillionStatus, setPillionStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [copied, setCopied] = useState(false);

  // Debounced pillion lookup
  useEffect(() => {
    if (!hasPillion || pillionCode.trim().length < 3) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPillionStatus("loading");
      const res = await lookupPillionAction(pillionCode);
      if (cancelled) return;
      if (res.ok && res.pillion) {
        setPillionInfo(res.pillion);
        setPillionStatus("found");
      } else {
        setPillionInfo(null);
        setPillionStatus("not_found");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hasPillion, pillionCode]);

  if (loading) return <div className="h-10 sm:h-12 w-full animate-pulse rounded-lg bg-surface-2" />;

  if (!user) {
    return (
      <Link
        href={`/login?next=/rides/${rideId}`}
        className={cn(buttonStyles("primary", "md", true), "!min-h-[38px] sm:!min-h-[44px] text-[11px] sm:text-xs py-2 sm:py-3.5")}
      >
        Sign in to join
      </Link>
    );
  }

  if (!registered && !member) {
    return (
      <Link
        href="/profile/kyc"
        className="inline-flex min-h-[38px] sm:min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-3 py-2 sm:px-4 sm:py-3.5 text-center text-[11px] sm:text-xs font-bold tracking-wider text-accent uppercase transition-[background-color,transform] duration-150 ease-out hover:bg-accent/20 active:scale-[0.97]"
      >
        {approval === "pending"
          ? "KYC under review — check status"
          : approval === "rejected"
            ? "KYC needs fixes — resubmit"
            : "Complete registration to join"}
      </Link>
    );
  }

  // Pillion View (Pillions cannot join alone; they join through their rider)
  if (memberType === "pillion" && !member) {
    const memberId = memberIdFromUserId(user.id);
    return (
      <div className="rounded-xl border border-border bg-surface-2 p-3.5 sm:p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider">
          <Users className="size-3.5" aria-hidden />
          <span>Pillion Member</span>
        </div>
        <p className="text-[11px] text-secondary leading-relaxed">
          Pillions join rides through their rider. Share your Member ID with your rider so they can add you:
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <code className="rounded-lg bg-surface px-2.5 py-1.5 font-mono text-xs font-bold text-accent border border-border">
            {memberId}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(memberId);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1.5 text-xs text-muted hover:text-white border border-border transition-colors cursor-pointer"
            title="Copy Member ID"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    setError(null);
    setBusy(true);

    if (hasPillion && !pillionInfo) {
      setError("Please enter a valid, registered Pillion Member ID.");
      setBusy(false);
      return;
    }

    const result = await joinRide(rideId, hasPillion ? pillionCode : undefined);
    if (result.ok) {
      setMember(true);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to join ride");
    }
    setBusy(false);
  };

  const handleLeave = async () => {
    setError(null);
    setBusy(true);
    const result = await leaveRide(rideId);
    if (result.ok) {
      setMember(false);
      setHasPillion(false);
      setPillionCode("");
      setPillionInfo(null);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to leave ride");
    }
    setBusy(false);
  };

  if (member) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={handleLeave}
          fullWidth
          className="!min-h-[38px] sm:!min-h-[44px] text-[11px] sm:text-xs py-2 sm:py-3.5"
        >
          {busy ? "Leaving..." : memberType === "pillion" ? "Leave Ride (Pillion)" : "Leave Ride"}
        </Button>
        {error && (
          <p className="text-[11px] text-danger flex items-center justify-center gap-1">
            <AlertCircle className="size-3 shrink-0" /> {error}
          </p>
        )}
      </div>
    );
  }

  const blockClosed = joiningPaused || isFull;
  if (blockClosed) {
    return (
      <Button
        variant="outline"
        disabled
        fullWidth
        className="!min-h-[38px] sm:!min-h-[44px] text-[11px] sm:text-xs py-2 sm:py-3.5"
      >
        {joiningPaused ? "Registrations Closed" : "Ride Full"}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pillion toggle for riders */}
      <div className="rounded-lg border border-border bg-surface-2/60 p-2.5 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] sm:text-xs text-text font-medium">
          <input
            type="checkbox"
            checked={hasPillion}
            onChange={(e) => {
              setHasPillion(e.target.checked);
              if (!e.target.checked) {
                setPillionCode("");
                setPillionInfo(null);
                setPillionStatus("idle");
              }
            }}
            className="size-3.5 rounded border-border text-accent focus:ring-accent"
          />
          <span>Bringing a pillion / co-rider?</span>
        </label>

        {hasPillion && (
          <div className="space-y-1.5 pt-1 border-t border-border/70">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={pillionCode}
                onChange={(e) => setPillionCode(e.target.value.toUpperCase())}
                placeholder="Pillion ID (e.g. MB-A1B2C3)"
                className="h-8 flex-1 rounded-md border border-border bg-surface px-2.5 font-mono text-xs uppercase text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            {pillionStatus === "loading" && (
              <p className="text-[10px] text-muted font-mono animate-pulse">Checking Member ID...</p>
            )}
            {pillionStatus === "found" && pillionInfo && (
              <p className="text-[10.5px] text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="size-3 shrink-0" />
                Pillion: {pillionInfo.full_name || pillionInfo.display_name}
              </p>
            )}
            {pillionStatus === "not_found" && (
              <p className="text-[10px] text-danger flex items-center gap-1">
                <AlertCircle className="size-3 shrink-0" />
                No registered pillion found with this ID
              </p>
            )}
            <p className="text-[9.5px] text-muted">
              Your pillion must register as a Pillion on MotoBharat to get their Member ID.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-danger flex items-center justify-center gap-1">
          <AlertCircle className="size-3 shrink-0" /> {error}
        </p>
      )}

      <Button
        variant="primary"
        disabled={busy || (hasPillion && !pillionInfo)}
        onClick={handleJoin}
        fullWidth
        className="!min-h-[38px] sm:!min-h-[44px] text-[11px] sm:text-xs py-2 sm:py-3.5"
      >
        {busy ? "Joining..." : hasPillion ? "Join with Pillion" : "Join Ride"}
      </Button>
    </div>
  );
}
