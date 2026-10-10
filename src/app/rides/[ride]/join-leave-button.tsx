"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { joinRide, leaveRide } from "./actions";

export function JoinLeaveButton({
  rideId,
  isMember,
}: {
  rideId: string;
  isMember: boolean;
}) {
  const { user, registered, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState(isMember);

  if (loading) return <div className="h-12 w-40 animate-pulse rounded-lg bg-surface-2" />;

  if (!user) {
    return (
      <Link
        href={`/login?next=/rides/${rideId}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-xs font-bold tracking-wider text-accent-fg uppercase transition-colors hover:bg-accent-hover"
      >
        Sign in to join
      </Link>
    );
  }

  if (!registered && !member) {
    return (
      <Link
        href="/profile/kyc"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-6 py-3.5 text-xs font-bold tracking-wider text-accent uppercase transition-colors hover:bg-accent/20"
      >
        Complete your KYC to join
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
      className="min-w-40"
    >
      {busy ? "..." : member ? "Leave Ride" : "Join Ride"}
    </Button>
  );
}
