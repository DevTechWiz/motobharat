"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { createAnnouncement, type RideFormState } from "../actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function AnnouncementForm({
  announcement,
  action = createAnnouncement,
}: {
  announcement?: { id: string; title: string; body: string };
  action?: (prev: RideFormState, formData: FormData) => Promise<RideFormState>;
}) {
  const [state, formAction] = useActionState(action, {} as RideFormState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" defaultValue={announcement?.title} required placeholder="Route change for Sunday ride" />
      </Field>
      <Field label="Body" htmlFor="body">
        <Textarea id="body" name="body" rows={5} defaultValue={announcement?.body} placeholder="Details for the community..." />
      </Field>
      <SubmitButton label={announcement ? "Save Changes" : "Publish Announcement"} />
    </form>
  );
}
