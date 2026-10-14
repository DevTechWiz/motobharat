import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/feedback";

// Global fallback: shows instantly on route transitions while the
// destination streams. Mirrors the home hero shape.
export default function RootLoading() {
  return (
    <div className="animate-fade-in" aria-label="Loading">
      <div className="border-b border-border">
        <Container className="space-y-6 py-14 lg:py-20">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-14 w-3/4 sm:h-20" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-12 w-36 rounded-lg" />
            <Skeleton className="h-12 w-36 rounded-lg" />
          </div>
        </Container>
      </div>
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      </Container>
    </div>
  );
}
