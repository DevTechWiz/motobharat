import Link from "next/link";
import { cn } from "@/lib/cn";

const styles = {
  primary:
    "relative overflow-hidden bg-accent text-accent-fg shadow-[0_8px_30px_-8px_var(--accent)] hover:bg-accent-hover hover:shadow-[0_12px_40px_-8px_var(--accent)]",
  secondary: "border border-border-strong text-text hover:border-accent/50 hover:bg-surface-2",
  outline: "border border-border-strong text-secondary hover:bg-surface hover:text-text",
  danger: "bg-danger text-white hover:brightness-110",
} as const;

const sizes = {
  md: "px-6 py-3.5 text-xs",
  sm: "px-4 py-2.5 text-[11px]",
} as const;

type Variant = keyof typeof styles;
type Size = keyof typeof sizes;

const base =
  "group/btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-bold uppercase tracking-wider transition-[background-color,border-color,color,transform,box-shadow] duration-200 hover:-translate-y-px active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:hover:translate-y-0";

export function buttonStyles(variant: Variant = "primary", size: Size = "md", full = false): string {
  return cn(base, styles[variant], sizes[size], full && "w-full");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles(variant, size, fullWidth), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <SpinnerGlyph />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  href,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className={cn(buttonStyles(variant, size, fullWidth), className)}>
      {children}
    </Link>
  );
}

function SpinnerGlyph() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
