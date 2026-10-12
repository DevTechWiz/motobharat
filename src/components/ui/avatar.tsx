"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
  xl: "size-24 text-3xl",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-semibold text-muted select-none",
        sizes[size],
        className,
      )}
    >
      {src && !hasError ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars rendered via next/image in M1
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="size-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}
