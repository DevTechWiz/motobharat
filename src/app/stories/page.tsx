import { Container, Section } from "@/components/layout/container";
import { PageMasthead } from "@/components/layout/page-masthead";
import { EmptyState } from "@/components/ui/feedback";
import { StoryCard } from "@/components/stories/story-card";
import { getStories } from "@/lib/stories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stories & Achievements · MotoBharat Warangal",
  description:
    "Celebrating milestones, endurance tour articles, and unforgettable expeditions undertaken by Warangal riders.",
};

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <>
      <PageMasthead
        eyebrow="Chronicles"
        title="Stories & Achievements"
        meta={
          stories.length > 0
            ? `${stories.length} ${stories.length === 1 ? "story" : "stories"} published`
            : undefined
        }
        lede="Celebrating milestone runs, endurance tours, and brotherhood chronicles from members of MotoBharat Warangal."
      />

      <Section>
        <Container>
          {stories.length === 0 ? (
            <EmptyState
              title="No stories yet"
              hint="When the community publishes touring chronicles or rider milestones, they will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
