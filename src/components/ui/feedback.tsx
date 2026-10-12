import { cn } from "@/lib/cn";
import { Inbox, Loader2 } from "lucide-react";

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("animate-pulse bg-surface-2", className)} />
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-muted", className)} aria-label="Loading" />;
}

export function EmptyState({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-16 text-center", className)}>
      <Inbox className="size-8 text-muted" aria-hidden />
      <p className="text-base font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
