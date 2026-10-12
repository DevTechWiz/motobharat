import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnnouncementForm } from "../announcement-form";

export default function NewAnnouncementPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/announcements"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to announcements
      </Link>
      <h2 className="text-lg font-bold">New Announcement</h2>
      <AnnouncementForm />
    </div>
  );
}
