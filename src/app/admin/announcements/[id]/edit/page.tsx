import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "../../announcement-form";
import { updateAnnouncement } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: announcement } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!announcement) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/announcements"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to announcements
      </Link>
      <h2 className="text-lg font-bold">Edit Announcement</h2>
      <AnnouncementForm
        announcement={announcement}
        action={updateAnnouncement.bind(null, announcement.id)}
      />
    </div>
  );
}
