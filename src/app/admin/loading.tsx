import { Skeleton } from "@/components/ui/feedback";

export default function AdminLoading() {
  return (
    <div className="animate-fade-in space-y-8" aria-label="Loading admin">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 w-36 rounded-lg" />
        <Skeleton className="h-11 w-48 rounded-lg" />
      </div>
    </div>
  );
}
