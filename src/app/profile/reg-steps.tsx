import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { n: 1, label: "Basic info", href: "/profile/setup?edit=true" },
  { n: 2, label: "Safety & KYC", href: "/profile/kyc" },
] as const;

// Shared registration rail: back to profile + 2-step progress.
// Used by /profile/setup (current=1) and /profile/kyc (current=2).
export function RegSteps({ current }: { current: 1 | 2 }) {
  return (
    <div className="space-y-4">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to profile
      </Link>
      <ol className="flex items-center gap-2" aria-label="Registration progress">
        {STEPS.map((s, i) => {
          const done = s.n < current;
          const active = s.n === current;
          const pill = (
            <>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full font-mono text-[10px] font-bold",
                  done
                    ? "bg-success/20 text-success"
                    : active
                      ? "bg-accent text-accent-fg"
                      : "bg-surface-2 text-muted"
                )}
              >
                {done ? <Check className="size-3" aria-hidden /> : s.n}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold whitespace-nowrap",
                  active ? "text-text" : "text-muted"
                )}
              >
                {s.label}
              </span>
            </>
          );
          return (
            <li key={s.n} className="flex flex-1 items-center gap-2 last:flex-none">
              {done ? (
                <Link
                  href={s.href}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:border-accent/40"
                >
                  {pill}
                </Link>
              ) : (
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2",
                    active ? "border-accent/50 bg-accent/10" : "border-border/60 opacity-50"
                  )}
                >
                  {pill}
                </span>
              )}
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1",
                    current === 2 ? "bg-accent/50" : "bg-border"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
