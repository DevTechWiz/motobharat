"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { PhotoPicker } from "@/components/ui/photo-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import { updateLockedFields } from "../../actions";

const BLOOD_OPTIONS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => ({
  value: bg,
  label: bg,
}));

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Saving…" : "Save corrections"}
    </Button>
  );
}

export function LockedFieldsForm({
  userId,
  initial,
}: {
  userId: string;
  initial: {
    dob: string | null;
    gender: string | null;
    blood_group: string | null;
    driving_licence: string | null;
    digital_signature: string | null;
    hasPhoto: boolean;
    approved: boolean;
  };
}) {
  const [state, formAction] = useActionState(updateLockedFields, {} as { error?: string; ok?: boolean });

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <input type="hidden" name="user_id" value={userId} />
      <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
        Correct locked fields
      </p>
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          Corrections saved.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Gender" htmlFor="lf-gender" required>
          <CustomSelect
            id="lf-gender"
            name="gender"
            required
            defaultValue={initial.gender ?? ""}
            placeholder="Select gender…"
            options={GENDER_OPTIONS}
          />
        </Field>
        <Field label="Blood Group" htmlFor="lf-blood" required>
          <CustomSelect
            id="lf-blood"
            name="blood_group"
            required
            defaultValue={initial.blood_group ?? ""}
            placeholder="Select blood group…"
            options={BLOOD_OPTIONS}
          />
        </Field>
        <Field label="Date of Birth" htmlFor="lf-dob" hint="Age is recalculated from this date" required>
          <Input
            id="lf-dob"
            name="dob"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            defaultValue={initial.dob ?? ""}
          />
        </Field>
        <Field label="Driving Licence Number" htmlFor="lf-dl" required>
          <Input
            id="lf-dl"
            name="driving_licence"
            required
            defaultValue={initial.driving_licence ?? ""}
            className="uppercase font-mono"
          />
        </Field>
        <Field label="Full Name / Digital Signature" htmlFor="lf-sig" required>
          <Input
            id="lf-sig"
            name="digital_signature"
            required
            defaultValue={initial.digital_signature ?? ""}
            placeholder="Full legal name as on DL"
          />
        </Field>
        {!initial.approved && (
          <Field
            label="Driving Licence Photo"
            htmlFor="lf-photo"
            hint={initial.hasPhoto ? "On file — uploading replaces it." : "Required — no photo on file."}
            required={!initial.hasPhoto}
          >
            <PhotoPicker
              id="lf-photo"
              name="dl_photo"
              required={!initial.hasPhoto}
              caption={initial.hasPhoto ? "Tap to replace the DL card" : "Tap to upload the DL card"}
            />
          </Field>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
