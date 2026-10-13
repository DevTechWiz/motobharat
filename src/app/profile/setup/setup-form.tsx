"use client";

import { useActionState, useRef, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, CalendarDays, Phone, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { CustomSelect } from "@/components/ui/custom-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { ageFromDob } from "@/lib/format";
import { saveBasicProfile, type ProfileFormState } from "../actions";
import type { RiderDetails } from "@/lib/types";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function SubmitButton({ isEdit, pending }: { isEdit: boolean; pending: boolean }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Save changes" : "Save & Continue"}
    </Button>
  );
}

function Group({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-2.5">
        <span className="rounded-lg border border-border bg-surface-2 p-2 text-accent">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-bold">{title}</span>
      </div>
      {children}
    </fieldset>
  );
}

export function SetupForm({
  initialData,
  profile,
  isEdit,
  locked,
  frozen,
}: {
  initialData: Partial<RiderDetails> | null;
  profile: { display_name: string; city: string | null } | null;
  isEdit: boolean;
  locked: boolean;
  frozen: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveBasicProfile, {} as ProfileFormState);
  const [isPending, startTransition] = useTransition();
  // No draft storage: inputs are uncontrolled (server values as defaults) and
  // submit dispatches manually, so error returns never clear anything.
  // Ephemeral UI state only (never persisted).
  const [sameAsPrimary, setSameAsPrimary] = useState(false);
  // Ephemeral UI state only (never persisted): WhatsApp mirror + DOB age line.
  const [wa, setWa] = useState<string | null>(null);
  const [dobShown, setDobShown] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const lastInvalidRef = useRef<number>(0);

  useEffect(() => {
    if (state?.ok) {
      router.push(state.next ?? "/profile");
    }
  }, [state?.ok, state?.next, router]);

  const handleInvalid = (e: React.FormEvent<HTMLFormElement>) => {
    const now = Date.now();
    if (now - lastInvalidRef.current < 800) return;
    lastInvalidRef.current = now;

    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target) return;

    setTimeout(() => {
      try {
        target.reportValidity();
      } catch {}
    }, 450);
  };

  useEffect(() => {
    if (state.error && errorRef.current) {
      const topbarOffset = 88;
      const rect = errorRef.current.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.top - topbarOffset;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
      errorRef.current.focus();
    }
  }, [state.error]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => formAction(new FormData(e.currentTarget)));
      }}
      onInvalidCapture={handleInvalid}
      className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <input type="hidden" name="edit" value={isEdit ? "true" : "false"} />
      <fieldset disabled={frozen || isPending} className="min-w-0 space-y-4 border-0 m-0 p-0">
      {frozen && (
        <div className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text">
          <p className="leading-relaxed">
            Submitted — under admin review. The form is locked until the verdict; what you see is
            exactly what&apos;s filed.
          </p>
        </div>
      )}

      <Group icon={User} title="Identity">
        <Field label="Profile Name" htmlFor="display_name" required hint="Public profile name — editable anytime">
          <Input
            id="display_name"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            required
            maxLength={50}
            placeholder="As you want it on ride lists"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="City / Location" htmlFor="city" hint="Your current base">
            <Input
              id="city"
              name="city"
              defaultValue={profile?.city ?? ""}
              placeholder="Warangal"
            />
          </Field>
          <Field label="Occupation" htmlFor="occupation" hint="Optional">
            <Input
              id="occupation"
              name="occupation"
              defaultValue={initialData?.occupation ?? ""}
              placeholder="e.g. Student, Engineer"
            />
          </Field>
        </div>
      </Group>

      <Group icon={CalendarDays} title="Date of Birth & Gender">
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-5">
          <Field
            label="Date of Birth"
            htmlFor="dob"
            hint={locked ? "Locked after approval" : "18+ required"}
            required
            className="min-[420px]:col-span-3"
          >
            <Input
              id="dob"
              name="dob"
              type="date"
              required
              disabled={locked}
              max={new Date().toISOString().slice(0, 10)}
              defaultValue={initialData?.dob ?? ""}
              onChange={(e) => setDobShown(e.target.value)}
            />
            <p className="text-xs whitespace-nowrap text-muted" aria-live="polite">
              {(() => {
                const dobVal = locked ? (initialData?.dob ?? "") : (dobShown ?? initialData?.dob ?? "");
                const shown = dobVal ? ageFromDob(String(dobVal)) : null;
                return shown != null ? `Age: ${shown} (calculated automatically)` : "";
              })()}
            </p>
          </Field>
        <Field
          label="Gender"
          htmlFor="gender"
          hint={locked && initialData?.gender ? "Locked after approval" : undefined}
          required
          className="min-[420px]:col-span-2"
        >
            <CustomSelect
              id="gender"
              name="gender"
              required
              disabled={locked && Boolean(initialData?.gender)}
              defaultValue={initialData?.gender ?? ""}
              placeholder="Select gender…"
              options={GENDER_OPTIONS}
            />
        </Field>
        </div>
      </Group>

      <Group icon={Phone} title="Contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Primary Phone" htmlFor="phone" required>
            <PhoneInput
              id="phone"
              name="phone"
              required
              defaultValue={initialData?.phone ?? ""}
              placeholder="+91 98765 43210"
            />
          </Field>
          <div>
            <Field label="WhatsApp Number" htmlFor="whatsapp_number" required>
              <PhoneInput
                id="whatsapp_number"
                name="whatsapp_number"
                required
                readOnly={sameAsPrimary}
                className={sameAsPrimary ? "opacity-50" : undefined}
                value={wa ?? initialData?.whatsapp_number ?? ""}
                onChange={(val) => {
                  setSameAsPrimary(false);
                  setWa(val);
                }}
                placeholder="+91 98765 43210"
              />
            </Field>
            <label
              htmlFor="wa_same"
              className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-secondary select-none"
            >
              <input
                id="wa_same"
                type="checkbox"
                checked={sameAsPrimary}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSameAsPrimary(checked);
                  if (!checked) {
                    setWa("");
                    return;
                  }
                  const form = e.currentTarget.form;
                  const primary = form
                    ? String(new FormData(form).get("phone") ?? "")
                    : (initialData?.phone ?? "");
                  setWa(primary);
                }}
                className="size-4 cursor-pointer accent-(--accent)"
              />
              Same as primary number
            </label>
          </div>
        </div>
      </Group>

      <div className="flex items-center justify-between pt-1">
        {isEdit ? (
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to profile
          </Link>
        ) : (
          <Link href="/" className="text-xs text-muted hover:text-secondary">
            Skip for now
          </Link>
        )}
        <SubmitButton isEdit={isEdit} pending={isPending} />
      </div>

      {state.error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger scroll-mt-28 outline-none"
        >
          {state.error}
        </div>
      )}

      {!isEdit && (
        <p className="border-t border-border pt-4 text-xs text-muted">
          Step 1 of 2 — personal info. Next: rider safety, bike details, and legal waiver.
        </p>
      )}
      </fieldset>
    </form>
  );
}
