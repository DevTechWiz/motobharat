export function AdminSection({
  num,
  title,
  hint,
  children,
}: {
  num: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-7">
      <div className="mb-6 flex items-baseline gap-3 border-b border-border pb-4">
        <span className="font-mono text-xs font-bold text-accent">{num}</span>
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="hidden font-mono text-[10px] tracking-wider text-muted uppercase sm:inline">
          · {hint}
        </span>
      </div>
      {children}
    </section>
  );
}
