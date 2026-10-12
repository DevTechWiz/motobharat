import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/feedback";

export default function RideDetailLoading() {
  return (
    <div className="animate-fade-in" aria-label="Loading ride">
      <div className="border-b border-border bg-surface-2/50">
        <Container className="space-y-4 py-8 sm:py-12">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-11 w-2/3" />
        </Container>
      </div>
      <div className="border-b border-border bg-surface">
        <Container className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </Container>
      </div>
      <Container className="grid gap-8 py-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </Container>
    </div>
  );
}
