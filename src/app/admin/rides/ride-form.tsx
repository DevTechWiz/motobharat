"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { toDatetimeLocalIST } from "@/lib/format";
import type { RideFormState } from "../actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function RideForm({
  ride,
  action,
}: {
  ride?: {
    id: string;
    title: string;
    description: string;
    starts_at: string;
    meeting_point: string;
    distance_km: number | null;
    difficulty: string | null;
    status: string;
  };
  action: (prev: RideFormState, formData: FormData) => Promise<RideFormState>;
}) {
  const [state, formAction] = useActionState(action, {} as RideFormState);
  const datetimeLocal = ride ? toDatetimeLocalIST(ride.starts_at) : "";

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" defaultValue={ride?.title} required placeholder="Sunday Morning Ride" />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={ride?.description} rows={4} placeholder="Route highlights, pace, stops..." />
      </Field>

      <Field label="Starts At (IST)" htmlFor="starts_at">
        <Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={datetimeLocal} required />
      </Field>

      <Field label="Meeting Point" htmlFor="meeting_point">
        <Input id="meeting_point" name="meeting_point" defaultValue={ride?.meeting_point} placeholder="Hanamkonda Police Station" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Distance (km)" htmlFor="distance_km">
          <Input id="distance_km" name="distance_km" type="number" defaultValue={ride?.distance_km ?? ""} placeholder="45" />
        </Field>
        <Field label="Difficulty" htmlFor="difficulty">
          <Select id="difficulty" name="difficulty" defaultValue={ride?.difficulty ?? ""}>
            <option value="">—</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </Select>
        </Field>
      </div>

      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={ride?.status ?? "draft"}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Upcoming (public)</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </Field>

      <p className="text-xs text-muted">
        Cover photo and gallery are managed below after the ride is saved.
      </p>

      <SubmitButton label={ride ? "Update Ride" : "Create Ride"} />
    </form>
  );
}
