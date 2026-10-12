import { Container, Section } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/feedback";

export default function ProfileLoading() {
  return (
    <div className="animate-fade-in" aria-label="Loading profile">
      <Section spacing="compact" border="bottom">
        <Container>
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-5">
              <Skeleton className="rounded-full size-24" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-56 max-w-full" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </Container>
      </Section>
    </div>
  );
}
