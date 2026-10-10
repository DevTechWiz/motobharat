import { cn } from "@/lib/cn";

const sizes = {
  sm: { word: "text-xl", sub: "text-[9px]", bar: "w-2.5" },
  lg: { word: "text-2xl sm:text-3xl", sub: "text-[11px]", bar: "w-4" },
} as const;

export function Wordmark({
  size = "sm",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span className={cn("flex flex-col items-center leading-none", className)}>
      <span className="flex items-baseline gap-1 py-0.5">
        <span className={cn("font-black text-white italic", s.word)}>MOTO</span>
        <span
          className={cn(
            "bg-linear-to-r from-accent via-orange to-danger bg-clip-text pr-2 font-black text-transparent italic",
            s.word,
          )}
        >
          BHARAT
        </span>
      </span>
      <span className="mt-1 flex items-center gap-1.5">
        <span className={cn("h-[2px] bg-danger", s.bar)} aria-hidden />
        <span
          className={cn(
            "font-extrabold tracking-[0.2em] text-secondary uppercase",
            s.sub,
          )}
        >
          Warangal
        </span>
        <span className={cn("h-[2px] bg-danger", s.bar)} aria-hidden />
      </span>
    </span>
  );
}
