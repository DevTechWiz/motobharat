import { cn } from "@/lib/cn";

const widths = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
} as const;

export function Container({
  size = "default",
  className,
  children,
}: {
  size?: keyof typeof widths;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widths[size], className)}>
      {children}
    </div>
  );
}

const spacings = {
  none: "py-0",
  compact: "py-6 sm:py-8 lg:py-12",
  default: "py-8 sm:py-12 lg:py-16",
  spacious: "py-10 sm:py-16 lg:py-20",
  hero: "py-8 sm:py-14 lg:py-20",
} as const;

const borders = {
  none: "",
  top: "border-t border-border",
  bottom: "border-b border-border",
  both: "border-y border-border",
} as const;

const bgs = {
  transparent: "",
  base: "bg-bg",
  surface: "bg-surface",
} as const;

export function Section({
  spacing = "default",
  border = "none",
  bg = "transparent",
  className,
  id,
  children,
}: {
  spacing?: keyof typeof spacings;
  border?: keyof typeof borders;
  bg?: keyof typeof bgs;
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("w-full", bgs[bg], borders[border], spacings[spacing], className)}>
      {children}
    </section>
  );
}
