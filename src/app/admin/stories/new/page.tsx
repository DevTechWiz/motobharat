import { StoryEditor } from "../story-editor";
import { createStory } from "../actions";

export const metadata = { title: "New Story · Admin" };

export default function NewStoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-text">Create Story or Achievement</h2>
        <p className="text-xs text-muted">Feature a rider achievement, long-distance touring chronicle, or club milestone.</p>
      </div>
      <StoryEditor action={createStory} />
    </div>
  );
}
