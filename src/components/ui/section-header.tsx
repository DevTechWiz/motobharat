"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function SectionHeader({
  eyebrow,
  title,
  cta,
}: {
  eyebrow: string;
  title: string;
  cta?: { href: string; label: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className="mb-5 sm:mb-8 flex flex-col gap-3 sm:gap-4 border-b border-border pb-3 sm:pb-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
          <span className="inline-block h-px w-4 sm:w-6 bg-accent" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">{title}</h2>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:text-accent"
        >
          <span>{cta.label}</span>
          <ArrowRight className="size-3.5 text-accent transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </motion.div>
  );
}
