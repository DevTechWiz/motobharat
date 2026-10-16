"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteStory } from "./actions";

export function DeleteStoryButton({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const confirm = async () => {
    setOpen(false);
    const result = await deleteStory(id);
    if (result.ok) {
      toast("Story deleted.", "success");
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
        className="rounded-md sm:rounded-lg border border-danger/30 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-danger hover:bg-danger/10 cursor-pointer flex items-center gap-1"
      >
        <Trash2 className="size-3" aria-hidden /> Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete this story?"
        body="This will permanently delete the story, narrative, and attached photos. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
