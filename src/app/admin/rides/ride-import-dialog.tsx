"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  parseRideImport,
  RIDE_IMPORT_TEMPLATE,
  type RideImportResult,
} from "@/lib/ride-import";

export function RideImportDialog({
  open,
  onApply,
  onCancel,
}: {
  open: boolean;
  onApply: (result: RideImportResult) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [report, setReport] = useState<RideImportResult | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Mounted fresh on every open (parent mounts conditionally), so state
  // starts empty — this effect only owns initial focus. The dialog closes
  // exclusively via its buttons (no backdrop or Escape dismissal), so a
  // half-pasted payload is never lost to a stray click.
  useEffect(() => {
    const t = window.setTimeout(() => areaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;

  const apply = () => {
    const result = parseRideImport(text);
    setReport(result);
    if (result.ok) onApply(result);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add ride from JSON"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border-strong bg-surface p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <ClipboardPaste className="size-4.5 text-accent" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold">Add ride from JSON</h2>
            <p className="text-xs text-muted">
              Paste ride details — Apply fills the form behind for your review. Nothing is created yet.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-white"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={'{\n  "title": "Sunday Lakeside Run",\n  "meeting_point": "Hanamkonda Fuel Station",\n  ...\n}'}
          aria-label="Ride JSON to paste"
          className="mt-4 min-h-44 w-full flex-1 rounded-lg border border-border bg-bg p-3 font-mono text-xs leading-relaxed text-text placeholder:text-muted focus:border-accent focus:outline-none"
        />

        {report && !report.ok && (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {report.error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setText(RIDE_IMPORT_TEMPLATE);
              setReport(null);
              areaRef.current?.focus();
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setText("");
              setReport(null);
            }}
          >
            Clear
          </Button>
          <span className="ml-auto flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={apply} disabled={!text.trim()}>
              Apply to form
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
