"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { setRideCoverByUrl, uploadRideCover, type MediaFormState } from "../../../actions";

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Uploading..." : "Upload Cover"}
    </Button>
  );
}

function SetUrlButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Checking..." : "Set Cover from Link"}
    </Button>
  );
}

export function CoverUpload({
  rideId,
  coverUrl,
}: {
  rideId: string;
  coverUrl: string | null;
}) {
  const action = uploadRideCover.bind(null, rideId);
  const [state, formAction] = useActionState(action, {} as MediaFormState);
  const urlAction = setRideCoverByUrl.bind(null, rideId);
  const [urlState, urlFormAction] = useActionState(urlAction, {} as MediaFormState);

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">Cover Photo</h3>
      <div className="flex flex-wrap items-start gap-6">
        <div className="relative aspect-16/10 w-56 overflow-hidden rounded-xl border border-border bg-surface-2">
          {coverUrl ? (
            <Image src={coverUrl} alt="Current ride cover" fill sizes="224px" className="object-cover" />
          ) : (
            <p className="flex size-full items-center justify-center text-xs text-muted">No cover</p>
          )}
        </div>
        <form action={formAction} className="flex-1 space-y-3">
          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.ok && <p className="text-sm text-success">Cover updated.</p>}
          <Field label="New cover (JPEG or WebP, max 10 MB)" htmlFor="cover">
            <Input id="cover" name="cover" type="file" accept="image/jpeg,image/webp" />
          </Field>
          <UploadButton />
        </form>
      </div>

      <form action={urlFormAction} className="max-w-xl space-y-3 border-t border-border pt-4">
        {urlState.error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {urlState.error}
          </p>
        )}
        {urlState.ok && <p className="text-sm text-success">Cover set from link.</p>}
        <Field label="…or paste an image URL (https, JPEG / WebP / PNG)" htmlFor="cover-url">
          <Input id="cover-url" name="cover_url" type="url" required placeholder="https://…" />
        </Field>
        <SetUrlButton />
      </form>
    </section>
  );
}
