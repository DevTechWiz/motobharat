import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/feedback";

export default function RidesLoading() {
  return (
    <div className="animate-fade-in" aria-label="Loading rides">
      <div className="border-b border-border">
        <Container className="space-y-3 py-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </Container>
      </div>
      <Container className="space-y-8 py-12">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-16/10 rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
