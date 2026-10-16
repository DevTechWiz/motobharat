"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bike, Megaphone, Users, Award } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/rides", label: "Rides", icon: Bike, exact: false },
  { href: "/admin/riders", label: "Riders", icon: Users, exact: false },
  { href: "/admin/stories", label: "Stories", icon: Award, exact: false },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, exact: false },
] as const;

// Segmented section switcher with active state — mirrors the profile
// "Edit profile" control language.
export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin sections"
      className="flex w-fit max-w-full overflow-x-auto rounded-xl border border-border bg-surface p-1"
    >
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all duration-200",
              active
                ? "bg-surface-3 text-accent shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                : "text-secondary hover:bg-surface-2 hover:text-white"
            )}
          >
            <t.icon className="size-3.5" aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
