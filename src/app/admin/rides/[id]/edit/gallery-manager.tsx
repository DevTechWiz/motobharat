"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { deleteMedia, addGalleryPhotoByUrl, uploadGalleryPhotos, type MediaFormState } from "../../../actions";

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Uploading..." : "Upload Photos"}
    </Button>
  );
}

function AddUrlButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Checking..." : "Add Photo"}
    </Button>
  );
}

function DeletePhotoButton({ id }: { id: string }) {
  const action = async () => {
    await deleteMedia(id);
  };
  return (
    <form action={action}>
      <button
        type="submit"
        aria-label="Delete photo"
        className="rounded-md bg-bg/80 p-1.5 text-danger transition-colors hover:bg-danger hover:text-white"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </form>
  );
}

export function GalleryManager({
  rideId,
  photos,
}: {
  rideId: string;
  photos: { id: string; url: string; alt: string }[];
}) {
  const action = uploadGalleryPhotos.bind(null, rideId);
  const [state, formAction] = useActionState(action, {} as MediaFormState);
  const urlAction = addGalleryPhotoByUrl.bind(null, rideId);
  const [urlState, urlFormAction] = useActionState(urlAction, {} as MediaFormState);

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">Gallery</h3>

      <form action={formAction} className="max-w-xl space-y-3">
        {state.error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sm text-success">Photos uploaded.</p>}
        <Field label="Photos (JPEG or WebP, max 10 MB each)" htmlFor="photos">
          <Input id="photos" name="photos" type="file" accept="image/jpeg,image/webp" multiple />
        </Field>
        <Field label="Alt text for all selected photos" htmlFor="alt">
          <Input id="alt" name="alt" required placeholder="Riders at the Pakhal Lake viewpoint" />
        </Field>
        <UploadButton />
      </form>

      <form action={urlFormAction} className="max-w-xl space-y-3 border-t border-border pt-4">
        {urlState.error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {urlState.error}
          </p>
        )}
        {urlState.ok && <p className="text-sm text-success">Photo added from link.</p>}
        <Field label="Add from link — image URL (https, JPEG / WebP / PNG, max 10 MB)" htmlFor="photo-url">
          <Input id="photo-url" name="url" type="url" required placeholder="https://…" />
        </Field>
        <Field label="Alt text" htmlFor="photo-url-alt">
          <Input id="photo-url-alt" name="alt" required placeholder="Riders at the Pakhal Lake viewpoint" />
        </Field>
        <AddUrlButton />
      </form>

      {photos.length === 0 ? (
        <p className="text-sm text-muted">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-surface-2">
              <Image src={p.url} alt={p.alt} fill sizes="(min-width:1024px) 16vw, (min-width:640px) 25vw, 50vw" className="object-cover" />
              <div className="absolute top-1.5 right-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                <DeletePhotoButton id={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
