import { notFound } from "next/navigation";
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
    <div>
      <h2 className="mb-6 text-lg font-bold">Edit Announcement</h2>
      <AnnouncementForm
        announcement={announcement}
        action={updateAnnouncement.bind(null, announcement.id)}
      />
    </div>
  );
}
