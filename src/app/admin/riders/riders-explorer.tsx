"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

export interface RiderRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  role: string;
  registered: boolean;
  submitted: boolean;
  rejected: boolean;
  hasDoc: boolean;
}

type StatusFilter = "all" | "pending" | "rejected" | "registered" | "incomplete";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending review" },
  { value: "rejected", label: "Rejected" },
  { value: "registered", label: "Registered" },
  { value: "incomplete", label: "Incomplete" },
];

function statusOf(r: RiderRow): Exclude<StatusFilter, "all"> {
  if (r.registered) return "registered";
  if (r.rejected) return "rejected";
  if (r.submitted) return "pending";
  return "incomplete";
}

export function RidersExplorer({ riders }: { riders: RiderRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const pendingCount = useMemo(() => riders.filter((r) => statusOf(r) === "pending").length, [riders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return riders.filter((r) => {
      if (status !== "all" && statusOf(r) !== status) return false;
      if (q && !`${r.display_name} ${r.city ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [riders, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          Riders{" "}
          <span className="font-mono text-sm font-semibold text-muted tabular-nums">
            ({filtered.length}/{riders.length})
          </span>
        </h2>
        {pendingCount > 0 ? (
          <button
            type="button"
            onClick={() => setStatus("pending")}
            className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-accent uppercase transition-colors hover:bg-accent/20"
          >
            {pendingCount} pending review
          </button>
        ) : (
          <p className="font-mono text-[11px] tracking-wider text-muted uppercase">
            Queue clear
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or city…"
            aria-label="Search riders"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3.5 pl-10 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by review status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              aria-pressed={status === f.value}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase transition-colors",
                status === f.value
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border-strong text-muted hover:border-accent/50 hover:text-text"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={riders.length === 0 ? "No riders yet" : "No riders match"}
          hint={
            riders.length === 0
              ? "Rider rows appear here the moment someone signs in with Google."
              : "Try a different search or filter."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-4 py-3 font-semibold">Rider</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">KYC Status</th>
                <th className="px-4 py-3 font-semibold">Licence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filtered.map((r) => {
                const s = statusOf(r);
                const open = () => router.push(`/admin/riders/${r.id}`);
                return (
                  <tr
                    key={r.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${r.display_name}`}
                    onClick={open}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        open();
                      }
                    }}
                    className="cursor-pointer transition-colors outline-none hover:bg-surface-2/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={r.display_name} src={r.avatar_url} size="sm" />
                        <span className="font-semibold">{r.display_name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary">{r.city ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.role === "admin" ? "hard" : "neutral"}>{r.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          s === "registered" ? "easy" : s === "rejected" ? "danger" : s === "pending" ? "moderate" : "neutral"
                        }
                      >
                        {s === "registered"
                          ? "Registered"
                          : s === "rejected"
                            ? "Rejected"
                            : s === "pending"
                              ? "Pending review"
                              : "Incomplete"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{r.hasDoc ? "Doc on file" : "No doc"}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
