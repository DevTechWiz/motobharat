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
  compact: "py-12 lg:py-16",
  default: "py-16 lg:py-24",
  spacious: "py-24 lg:py-32",
  hero: "py-20 lg:py-28",
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
