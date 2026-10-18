"use client";

import type { ReactNode } from "react";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title,
  body,
  children,
  confirmLabel = "Confirm",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  children?: ReactNode;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="mt-2 text-sm text-secondary">{body}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
