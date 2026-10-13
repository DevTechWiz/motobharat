import { Container } from "@/components/layout/container";

export function PageMasthead({
  eyebrow,
  title,
  meta,
  lede,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  lede?: string;
}) {
  return (
    <div className="border-b border-border">
      <Container className="py-4 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 sm:gap-y-2">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-extrabold tracking-tight">
              {title}
            </h1>
          </div>
          {meta && (
            <p className="font-mono text-[10px] sm:text-[11px] tracking-wider text-muted uppercase tabular-nums">
              {meta}
            </p>
          )}
        </div>
        {lede && <p className="mt-1.5 sm:mt-2 max-w-2xl text-xs sm:text-sm text-secondary">{lede}</p>}
      </Container>
    </div>
  );
}
