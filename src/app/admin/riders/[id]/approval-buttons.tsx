"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { approveRider, rejectRider } from "../../actions";

export function ApprovalButtons({
  userId,
  approved,
  hasSubmission = true,
}: {
  userId: string;
  approved: boolean;
  hasSubmission?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [which, setWhich] = useState<"reject" | "revoke">("reject");

  const openDialog = (kind: "reject" | "revoke") => {
    setWhich(kind);
    setReason("");
    setConfirming(true);
  };

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

  const dialogBody =
    which === "revoke"
      ? "The rider goes back to unapproved access."
      : "The rider goes back to fixes — they can correct their details and resubmit.";

  return (
    <>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        {!approved && (
          <Button
            type="button"
            disabled={pending || !hasSubmission}
            title={!hasSubmission ? "Rider has not submitted KYC details yet" : undefined}
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
          disabled={pending || (!approved && !hasSubmission)}
          title={!approved && !hasSubmission ? "No submission to reject" : undefined}
          className="w-full sm:w-auto"
          onClick={() => openDialog(approved ? "revoke" : "reject")}
        >
          <ShieldX className="size-4" aria-hidden />
          {approved ? "Revoke approval" : "Reject application"}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={which === "revoke" ? "Revoke this approval?" : "Reject this application?"}
        body={dialogBody}
        confirmLabel={which === "revoke" ? "Revoke approval" : "Reject application"}
        confirmDisabled={!reason.trim()}
        onConfirm={() => {
          setConfirming(false);
          run(
            () => rejectRider(userId, reason),
            which === "revoke" ? "Approval revoked." : "Application rejected.",
          );
        }}
        onCancel={() => setConfirming(false)}
      >
        <div>
          <label htmlFor="rejection-reason" className="block text-sm font-semibold">
            Reason <span className="text-danger">*</span>
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            required
            autoFocus
            placeholder="e.g. DL photo is blurry — retake and upload a clear one"
            className="mt-1.5 min-h-[80px] w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder-muted focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted">
            Shown to the rider on their KYC page. {reason.length}/500
          </p>
        </div>
      </ConfirmDialog>
    </>
  );
}
