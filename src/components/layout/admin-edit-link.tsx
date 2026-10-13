import Link from "next/link";
import { Pencil } from "lucide-react";

// Admin-only shortcut rendered on public detail pages (behind a server-side
// role check in the page). Display-only: it deep-links into the gated
// /admin edit screen, which enforces proxy + requireAdmin + RLS on its own.
export function AdminEditLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange/40 bg-orange/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-orange uppercase transition-all duration-200 hover:bg-orange/20"
    >
      <Pencil className="size-3" aria-hidden />
      {label}
    </Link>
  );
}
