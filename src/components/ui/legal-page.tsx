import { Container, Section } from "@/components/layout/container";

export type LegalSection = {
  title: string;
  body?: string[];
  items?: string[];
};

export function LegalPage({
  title,
  lede,
  effective,
  sections,
}: {
  title: string;
  lede: string;
  effective: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Section spacing="compact" border="bottom">
        <Container size="narrow">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Legal</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-5xl tracking-tight">{title}</h1>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-secondary">{lede}</p>
          <p className="mt-3 sm:mt-4 font-mono text-[10px] sm:text-[11px] tracking-wider text-muted uppercase tabular-nums">
            Effective {effective}
          </p>
        </Container>
      </Section>

      <Section spacing="default">
        <Container size="narrow">
          {sections.map((s) => (
            <div key={s.title} className="border-b border-border py-5 sm:py-8 last:border-0 last:pb-0">
              <h2 className="text-base font-bold sm:text-xl">{s.title}</h2>
              {s.body?.map((p, i) => (
                <p key={i} className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-relaxed text-secondary">
                  {p}
                </p>
              ))}
              {s.items && (
                <ul className="mt-4 space-y-2.5">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-3 text-sm leading-relaxed text-secondary">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Container>
      </Section>
    </>
  );
}
