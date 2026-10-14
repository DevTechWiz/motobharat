"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { approveRider, rejectRider } from "../../actions";

export function ApprovalButtons({ userId, approved }: { userId: string; approved: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setPending(true);
    const result = await fn();
    setPending(false);
    if (result.ok) {
      toast(okMsg, "success");
      router.refresh();
    } else {
      toast(result.error ?? "Action failed.", "error");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        {!approved && (
          <Button
            type="button"
            disabled={pending}
            className="w-full sm:w-auto"
            onClick={() => run(() => approveRider(userId), "Rider approved — joins and ID card unlocked.")}
          >
            <ShieldCheck className="size-4" aria-hidden />
            Approve rider
          </Button>
        )}
        <Button
          type="button"
          variant={approved ? "secondary" : "danger"}
          disabled={pending}
          className="w-full sm:w-auto"
          onClick={() => (approved ? run(() => rejectRider(userId), "Approval revoked.") : setConfirming(true))}
        >
          <ShieldX className="size-4" aria-hidden />
          {approved ? "Revoke approval" : "Reject application"}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Reject this application?"
        body="The rider goes back to fixes — they can correct their details and resubmit."
        confirmLabel="Reject application"
        onConfirm={() => {
          setConfirming(false);
          run(() => rejectRider(userId), "Application rejected.");
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
