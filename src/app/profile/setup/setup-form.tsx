"use client";

import { useActionState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowLeft, User, CalendarDays, Phone, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { CustomSelect } from "@/components/ui/custom-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { useFormDraft } from "@/lib/use-form-draft";
import { saveBasicProfile, type ProfileFormState } from "../actions";
import type { RiderDetails } from "@/lib/types";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
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
}: {
  initialData: Partial<RiderDetails> | null;
  profile: { display_name: string; city: string | null } | null;
  isEdit: boolean;
}) {
  const [state, formAction] = useActionState(saveBasicProfile, {} as ProfileFormState);
  const { updateDraft, getDraftVal } = useFormDraft("motobharat_draft_setup");
  const errorRef = useRef<HTMLDivElement>(null);
  const lastInvalidRef = useRef<number>(0);

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
      action={formAction}
      onInvalidCapture={handleInvalid}
      className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <input type="hidden" name="edit" value={isEdit ? "true" : "false"} />
      {state.error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger scroll-mt-28 outline-none"
        >
          {state.error}
        </div>
      )}

      <Group icon={User} title="Identity">
        <Field label="Full Name" htmlFor="display_name" required>
          <Input
            id="display_name"
            name="display_name"
            value={getDraftVal("display_name", profile?.display_name ?? "")}
            onChange={(e) => updateDraft("display_name", e.target.value)}
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
              value={getDraftVal("city", profile?.city ?? "")}
              onChange={(e) => updateDraft("city", e.target.value)}
              placeholder="Warangal"
            />
          </Field>
          <Field label="Occupation" htmlFor="occupation" hint="Optional">
            <Input
              id="occupation"
              name="occupation"
              value={getDraftVal("occupation", initialData?.occupation ?? "")}
              onChange={(e) => updateDraft("occupation", e.target.value)}
              placeholder="e.g. Student, Engineer"
            />
          </Field>
        </div>
      </Group>

      <Group icon={CalendarDays} title="Age & Gender">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of Birth" htmlFor="dob" hint="18+ required" required>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={getDraftVal("dob", initialData?.dob ?? "")}
              onChange={(e) => {
                const val = e.target.value;
                updateDraft("dob", val);
                if (val) {
                  const b = new Date(val);
                  if (!isNaN(b.getTime())) {
                    const today = new Date();
                    let age = today.getFullYear() - b.getFullYear();
                    const m = today.getMonth() - b.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
                    updateDraft("age", String(age));
                  }
                }
              }}
            />
          </Field>
          <Field label="Age" htmlFor="age" hint="Whole number" required>
            <Input
              id="age"
              name="age"
              type="number"
              min={18}
              max={90}
              required
              value={getDraftVal("age", initialData?.age ? String(initialData.age) : "")}
              onChange={(e) => updateDraft("age", e.target.value)}
              placeholder="26"
            />
          </Field>
        </div>

        <Field label="Gender" htmlFor="gender" required>
          <CustomSelect
            id="gender"
            name="gender"
            required
            value={getDraftVal("gender", initialData?.gender ?? "")}
            onChange={(val) => updateDraft("gender", val)}
            placeholder="Select gender…"
            options={GENDER_OPTIONS}
          />
        </Field>
      </Group>

      <Group icon={Phone} title="Contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Primary Phone" htmlFor="phone" required>
            <PhoneInput
              id="phone"
              name="phone"
              required
              value={getDraftVal("phone", initialData?.phone ?? "")}
              onChange={(val) => updateDraft("phone", val)}
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="WhatsApp Number" htmlFor="whatsapp_number" hint="If same, re-enter or leave">
            <PhoneInput
              id="whatsapp_number"
              name="whatsapp_number"
              value={getDraftVal("whatsapp_number", initialData?.whatsapp_number ?? "")}
              onChange={(val) => updateDraft("whatsapp_number", val)}
              placeholder="+91 98765 43210"
            />
          </Field>
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
        <SubmitButton isEdit={isEdit} />
      </div>

      {!isEdit && (
        <p className="border-t border-border pt-4 text-xs text-muted">
          Step 1 of 2 — personal info. Next: rider safety, bike details, and legal waiver.
        </p>
      )}
    </form>
  );
}
