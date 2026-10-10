import { cn } from "@/lib/cn";

const tones = {
  easy: "bg-success/15 text-success",
  moderate: "bg-accent/15 text-accent",
  hard: "bg-orange/15 text-orange",
  neutral: "bg-surface-2 text-secondary",
  danger: "bg-danger/15 text-danger",
} as const;

type Tone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
