import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/feedback";

export default function AnnouncementsLoading() {
  return (
    <div className="animate-fade-in" aria-label="Loading announcements">
      <div className="border-b border-border">
        <Container className="space-y-3 py-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </Container>
      </div>
      <Container className="max-w-3xl space-y-4 py-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-surface p-6">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </Container>
    </div>
  );
}
