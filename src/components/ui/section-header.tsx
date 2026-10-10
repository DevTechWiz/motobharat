import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  eyebrow,
  title,
  cta,
}: {
  eyebrow: string;
  title: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-4xl">{title}</h2>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:text-accent"
        >
          <span>{cta.label}</span>
          <ArrowRight className="size-3.5 text-accent" />
        </Link>
      )}
    </div>
  );
}
