import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RideForm } from "../ride-form";
import { createRide } from "../../actions";

export default function NewRidePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/rides"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to rides
      </Link>
      <h2 className="text-lg font-bold">New Ride</h2>
      <RideForm action={createRide} />
    </div>
  );
}
