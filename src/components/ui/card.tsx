import Link from "next/link";
import { cn } from "@/lib/cn";

const cardClass = "block rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-2";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("rounded-xl border border-border bg-surface p-5", className)}>{children}</div>;
}

export function CardLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(cardClass, "focus-visible:outline-2 focus-visible:outline-accent", className)}
    >
      {children}
    </Link>
  );
}
