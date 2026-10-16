import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryEditor } from "../../story-editor";
import { updateStory } from "../../actions";
import type { Story } from "@/lib/types";

export const metadata = { title: "Edit Story · Admin" };

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase.from("stories").select("*");
  const { data } = isUuid
    ? await query.eq("id", id).maybeSingle()
    : await query.eq("slug", id).maybeSingle();

  const story = data as Story | null;
  if (!story) notFound();

  const boundUpdate = updateStory.bind(null, story.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-text">Edit Story</h2>
        <p className="text-xs text-muted">Update details, cover image, highlights, or gallery.</p>
      </div>
      <StoryEditor story={story} action={boundUpdate} />
    </div>
  );
}
