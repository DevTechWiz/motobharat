"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { CustomSelect } from "@/components/ui/custom-select";
import { updateLockedFields } from "../../actions";

const BLOOD_OPTIONS = [
  ...["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => ({
    value: bg,
    label: bg,
  })),
  { value: "Not Sure", label: "Not sure / Don't know" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} size="sm" className="w-full sm:w-auto">
      {pending ? "Saving…" : "Save corrections"}
    </Button>
  );
}

export function LockedFieldsForm({
  userId,
  initial,
  memberType = "rider",
  hasSubmission = true,
}: {
  userId: string;
  initial: {
    dob: string | null;
    gender: string | null;
    blood_group: string | null;
    driving_licence: string | null;
    digital_signature: string | null;
  };
  memberType?: string;
  hasSubmission?: boolean;
}) {
  const [state, formAction] = useActionState(updateLockedFields, {} as { error?: string; ok?: boolean });
  // Manual dispatch (not action={}): React clears file inputs when a managed
  // submit completes — manual dispatch leaves the whole form, files included,
  // exactly as the admin left it when an error comes back.
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => formAction(new FormData(e.currentTarget)));
      }}
      className="rounded-xl border border-border bg-surface p-3 sm:p-5"
    >
      <input type="hidden" name="user_id" value={userId} />
      <fieldset disabled={isPending || !hasSubmission} className="min-w-0 space-y-3.5 sm:space-y-4 border-0 m-0 p-0">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
          Correct locked fields
        </p>
        {!hasSubmission && (
          <span className="text-[11px] text-muted">No KYC submission on file</span>
        )}
      </div>
      <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
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
        {memberType !== "pillion" && (
          <Field label="Driving Licence Number" htmlFor="lf-dl" required>
            <Input
              id="lf-dl"
              name="driving_licence"
              required
              defaultValue={initial.driving_licence ?? ""}
              className="uppercase font-mono"
            />
          </Field>
        )}
        <Field label="Full Name / Digital Signature" htmlFor="lf-sig" required>
          <Input
            id="lf-sig"
            name="digital_signature"
            required
            defaultValue={initial.digital_signature ?? ""}
            placeholder="Full legal name as on DL"
          />
        </Field>
      </div>

      <div className="space-y-3 pt-1">
        <SubmitButton pending={isPending} />

        {state.error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-danger">
            {state.error}
          </div>
        )}
        {state.ok && (
          <div className="rounded-lg border border-success/30 bg-success/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-success">
            Corrections saved.
          </div>
        )}
      </div>
      </fieldset>
    </form>
  );
}
