import { cn } from "@/lib/cn";

const sizes = {
  sm: "h-8 w-auto",
  lg: "h-10 w-auto sm:h-12",
} as const;

export function Wordmark({
  size = "sm",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset (1152x285 lockup)
    <img
      src="/brand/MotoBharatWarangal.png"
      alt="MotoBharat Warangal"
      width={1152}
      height={285}
      className={cn(sizes[size], className)}
    />
  );
}
