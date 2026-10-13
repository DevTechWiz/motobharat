"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button, buttonStyles } from "@/components/ui/button";
import { joinRide, leaveRide } from "./actions";

export function JoinLeaveButton({
  rideId,
  isMember,
}: {
  rideId: string;
  isMember: boolean;
}) {
  const { user, registered, approval, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState(isMember);

  if (loading) return <div className="h-12 w-full animate-pulse rounded-lg bg-surface-2" />;

  if (!user) {
    return (
      <Link
        href={`/login?next=/rides/${rideId}`}
        className={buttonStyles("primary", "md", true)}
      >
        Sign in to join
      </Link>
    );
  }

  if (!registered && !member) {
    return (
      <Link
        href="/profile/kyc"
        className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-4 py-3.5 text-center text-xs font-bold tracking-wider text-accent uppercase transition-[background-color,transform] duration-150 ease-out hover:bg-accent/20 active:scale-[0.97]"
      >
        {approval === "pending"
          ? "KYC under review — check status"
          : approval === "rejected"
            ? "KYC needs fixes — resubmit"
            : "Complete your KYC to join"}
      </Link>
    );
  }

  const toggle = async () => {
    setBusy(true);
    const result = member ? await leaveRide(rideId) : await joinRide(rideId);
    if (result.ok) {
      setMember(!member);
      router.refresh();
    }
    setBusy(false);
  };

  return (
    <Button
      variant={member ? "outline" : "primary"}
      disabled={busy}
      onClick={toggle}
      fullWidth
    >
      {busy ? "..." : member ? "Leave Ride" : "Join Ride"}
    </Button>
  );
}
