import { cn } from "@/lib/cn";

const base =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 sm:px-3.5 sm:py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50 scroll-mt-28";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-28", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full scroll-mt-28">
      <select
        className={cn(
          base,
          "appearance-none pr-10 cursor-pointer bg-surface text-text [&>optgroup]:bg-surface-2 [&>optgroup]:text-secondary [&>optgroup]:font-bold [&>option]:bg-surface-2 [&>option]:text-text [&>option]:py-2",
          className
        )}
        style={{ colorScheme: "dark" }}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted">
        <svg
          className="size-4 text-secondary"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 8l4 4 4-4" />
        </svg>
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5 scroll-mt-28", className)}>
      <label htmlFor={htmlFor} className="flex items-center justify-between text-xs font-bold tracking-wider text-secondary uppercase">
        <span>
          {label}
          {required && <span className="ml-1 text-accent font-black" title="Compulsory">*</span>}
        </span>
        {!required && (
          <span className="font-normal font-mono text-[10px] text-muted normal-case tracking-normal">
            optional
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
