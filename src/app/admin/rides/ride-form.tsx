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

      <Field label="Title" htmlFor="title" required>
        <Input id="title" name="title" defaultValue={ride?.title} required placeholder="Sunday Morning Ride" />
      </Field>

      <Field label="Description" htmlFor="description" required>
        <Textarea id="description" name="description" defaultValue={ride?.description} rows={4} required placeholder="Route highlights, pace, stops..." />
      </Field>

      <Field label="Starts At (IST)" htmlFor="starts_at" required>
        <Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={datetimeLocal} required />
      </Field>

      <Field label="Meeting Point" htmlFor="meeting_point" required>
        <Input id="meeting_point" name="meeting_point" defaultValue={ride?.meeting_point} required placeholder="Hanamkonda Police Station" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Distance (km)" htmlFor="distance_km" required>
          <Input id="distance_km" name="distance_km" type="number" min={1} step="any" required defaultValue={ride?.distance_km ?? ""} placeholder="45" />
        </Field>
        <Field label="Difficulty" htmlFor="difficulty" required>
          <Select id="difficulty" name="difficulty" required defaultValue={ride?.difficulty ?? ""}>
            <option value="">Select…</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </Select>
        </Field>
      </div>

      <Field label="Status" htmlFor="status" required>
        <Select id="status" name="status" defaultValue={ride?.status ?? "draft"}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Upcoming (public)</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </Field>

      {!ride && (
        <Field
          label="Cover image URL"
          htmlFor="cover_url"
          hint="https JPEG / WebP / PNG — gallery uploads unlock after R2 keys land"
          required
        >
          <Input id="cover_url" name="cover_url" type="url" required placeholder="https://…" />
        </Field>
      )}

      <p className="text-xs text-muted">
        {ride
          ? "Cover photo and gallery are managed in sections 02–03 below."
          : "Gallery photos can be added after the ride is created."}
      </p>

      <SubmitButton label={ride ? "Update Ride" : "Create Ride"} />
    </form>
  );
}
