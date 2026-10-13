"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { createAnnouncement, type RideFormState } from "../actions";

export function AnnouncementForm({
  announcement,
  action = createAnnouncement,
}: {
  announcement?: { id: string; title: string; body: string };
  action?: (prev: RideFormState, formData: FormData) => Promise<RideFormState>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, {} as RideFormState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      router.push(state.next ?? "/admin/announcements");
    }
  }, [state?.ok, state?.next, router]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => formAction(new FormData(e.currentTarget)));
      }}
      className="max-w-xl space-y-5"
    >
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <fieldset disabled={isPending} className="min-w-0 space-y-5 border-0 m-0 p-0">
        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            defaultValue={announcement?.title ?? ""}
            placeholder="Route change for Sunday ride"
          />
        </Field>
        <Field label="Body" htmlFor="body">
          <Textarea
            id="body"
            name="body"
            rows={5}
            defaultValue={announcement?.body ?? ""}
            placeholder="Details for the community..."
          />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : announcement ? "Save Changes" : "Publish Announcement"}
        </Button>
      </fieldset>
    </form>
  );
}
