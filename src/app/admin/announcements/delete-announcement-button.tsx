"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAnnouncement } from "../actions";

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const confirm = async () => {
    setOpen(false);
    const result = await deleteAnnouncement(id);
    if (result.ok) {
      toast("Announcement deleted.", "success");
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
        className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
      >
        <Trash2 className="size-3" aria-hidden /> Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete this announcement?"
        body="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
