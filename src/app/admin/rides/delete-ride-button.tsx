"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteRide } from "../actions";

export function DeleteRideButton({ rideId }: { rideId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const confirm = async () => {
    setOpen(false);
    const result = await deleteRide(rideId);
    if (result.ok) {
      toast("Ride deleted.", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Failed to delete.", "error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
      >
        <Trash2 className="size-3" aria-hidden /> Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete this ride?"
        body="This removes the ride and all member signups. This cannot be undone."
        confirmLabel="Delete ride"
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
