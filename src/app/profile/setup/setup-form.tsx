"use client";

import { useActionState, useRef, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, User, CalendarDays, Phone, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { CustomSelect } from "@/components/ui/custom-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { ageFromDob } from "@/lib/format";
import {
  getStoredDraft,
  setStoredDraft,
  removeStoredDraft,
  serializeForm,
  isDraftDifferent,
} from "@/lib/form-draft";
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
    <fieldset className="min-w-0 space-y-3 sm:space-y-4 rounded-xl border border-border bg-bg/60 p-3 sm:p-4">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-2">
        <span className="rounded-md sm:rounded-lg border border-border bg-surface-2 p-1.5 sm:p-2 text-accent">
          <Icon className="size-3.5 sm:size-4" aria-hidden />
        </span>
        <span className="text-xs sm:text-sm font-bold">{title}</span>
      </div>
      {children}
    </fieldset>
  );
}

export function SetupForm({
  userId,
  initialData,
  profile,
  isEdit,
  locked,
  frozen,
}: {
  userId?: string;
  initialData: Partial<RiderDetails> | null;
  profile: { display_name: string; city: string | null } | null;
  isEdit: boolean;
  locked: boolean;
  frozen: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveBasicProfile, {} as ProfileFormState);
  const [isPending, startTransition] = useTransition();
  const initialPhone = initialData?.phone ?? "";
  const initialWa = initialData?.whatsapp_number ?? "";
  const initialSame = Boolean(
    initialPhone &&
      initialWa &&
      initialPhone.replace(/\D/g, "") === initialWa.replace(/\D/g, "")
  );

  const draftKey = userId ? `motobharat_draft_setup_${userId}` : "motobharat_draft_setup";
  const [draftValues, setDraftValues] = useState<Record<string, string | boolean> | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [phone, setPhone] = useState(initialPhone);
  const [wa, setWa] = useState(initialWa);
  const [sameAsPrimary, setSameAsPrimary] = useState(initialSame);
  const [dobShown, setDobShown] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const lastInvalidRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraftImmediately = () => {
    if (locked || frozen || !formRef.current) return;
    const serialized = serializeForm(formRef.current);
    const baseline = {
      display_name: profile?.display_name ?? "",
      city: profile?.city ?? "",
      occupation: initialData?.occupation ?? "",
      dob: initialData?.dob ?? "",
      gender: initialData?.gender ?? "",
      phone: initialPhone,
      whatsapp_number: initialWa,
      wa_same: initialSame,
    };
    if (isDraftDifferent(serialized, baseline)) {
      setStoredDraft(draftKey, serialized);
    } else {
      removeStoredDraft(draftKey);
    }
  };

  const saveDraftRef = useRef(saveDraftImmediately);
  useEffect(() => {
    saveDraftRef.current = saveDraftImmediately;
  });

  const scheduleDraftSave = () => {
    if (locked || frozen) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(saveDraftImmediately, 350);
  };

  // Restore draft on mount if available
  useEffect(() => {
    if (locked || frozen) {
      removeStoredDraft(draftKey);
      return;
    }
    const timer = setTimeout(() => {
      const draft = getStoredDraft(draftKey);
      if (!draft?.data) return;

      const baseline = {
        display_name: profile?.display_name ?? "",
        city: profile?.city ?? "",
        occupation: initialData?.occupation ?? "",
        dob: initialData?.dob ?? "",
        gender: initialData?.gender ?? "",
        phone: initialPhone,
        whatsapp_number: initialWa,
        wa_same: initialSame,
      };

      if (isDraftDifferent(draft.data, baseline)) {
        setDraftValues(draft.data as Record<string, string | boolean>);
        setHasRestoredDraft(true);
        if (typeof draft.data.phone === "string") {
          setPhone(draft.data.phone);
        }
        if (typeof draft.data.whatsapp_number === "string") {
          setWa(draft.data.whatsapp_number);
        }
        if (typeof draft.data.wa_same === "boolean") {
          setSameAsPrimary(draft.data.wa_same);
        }
        if (typeof draft.data.dob === "string") {
          setDobShown(draft.data.dob);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [draftKey, locked, frozen, initialPhone, initialWa, initialSame, profile, initialData]);

  // Flush unsaved draft on tab switch or page close
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        saveDraftRef.current();
      }
    };
    const handleBeforeUnload = () => {
      saveDraftRef.current();
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (state?.ok) {
      removeStoredDraft(draftKey);
      if (!isEdit) {
        router.push(state.next ?? "/profile");
      }
    }
  }, [state?.ok, state?.next, router, draftKey, isEdit]);

  const handleDiscardDraft = () => {
    removeStoredDraft(draftKey);
    setDraftValues(null);
    setHasRestoredDraft(false);
    setPhone(initialPhone);
    setWa(initialWa);
    setSameAsPrimary(initialSame);
    setDobShown(null);
    setFormKey((k) => k + 1);
  };

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
      key={formKey}
      ref={formRef}
      onChange={scheduleDraftSave}
      onInput={scheduleDraftSave}
      onSubmit={(e) => {
        e.preventDefault();
        saveDraftImmediately();
        startTransition(() => formAction(new FormData(e.currentTarget)));
      }}
      onInvalidCapture={handleInvalid}
      className="rounded-xl sm:rounded-2xl border border-border bg-surface p-3 sm:p-5"
    >
      <input type="hidden" name="edit" value={isEdit ? "true" : "false"} />
      <fieldset disabled={frozen || isPending} className="min-w-0 space-y-3 sm:space-y-4 border-0 m-0 p-0">
      {hasRestoredDraft && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-text">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Sparkles className="size-4 text-accent shrink-0" aria-hidden />
            <span className="truncate">Recovered unsaved draft from your browser.</span>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="text-xs font-semibold text-accent hover:text-accent-hover underline underline-offset-2 transition-colors cursor-pointer shrink-0"
          >
            Discard draft
          </button>
        </div>
      )}
      {frozen && (
        <div className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-text">
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
            defaultValue={typeof draftValues?.display_name === "string" ? draftValues.display_name : (profile?.display_name ?? "")}
            required
            maxLength={50}
            placeholder="e.g. Rahul Sharma"
          />
        </Field>

        <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field label="City / Location" htmlFor="city" required hint="Your current base">
            <Input
              id="city"
              name="city"
              defaultValue={typeof draftValues?.city === "string" ? draftValues.city : (profile?.city ?? "")}
              required
              maxLength={100}
              placeholder="e.g. Warangal"
            />
          </Field>
          <Field label="Occupation" htmlFor="occupation" hint="Your profession or field of study">
            <Input
              id="occupation"
              name="occupation"
              defaultValue={typeof draftValues?.occupation === "string" ? draftValues.occupation : (initialData?.occupation ?? "")}
              placeholder="e.g. Student, Engineer"
            />
          </Field>
        </div>
      </Group>

      <Group icon={CalendarDays} title="Date of Birth & Gender">
        <div className="grid grid-cols-1 gap-2.5 sm:gap-4 min-[420px]:grid-cols-5">
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
              defaultValue={typeof draftValues?.dob === "string" ? draftValues.dob : (initialData?.dob ?? "")}
              onChange={(e) => setDobShown(e.target.value)}
            />
            <p className="text-[11px] sm:text-xs whitespace-nowrap text-muted" aria-live="polite">
              {(() => {
                const draftDob = typeof draftValues?.dob === "string" ? draftValues.dob : undefined;
                const dobVal = locked ? (initialData?.dob ?? "") : (dobShown ?? draftDob ?? initialData?.dob ?? "");
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
              defaultValue={typeof draftValues?.gender === "string" ? draftValues.gender : (initialData?.gender ?? "")}
              placeholder="Select gender…"
              options={GENDER_OPTIONS}
            />
        </Field>
        </div>
      </Group>

      <Group icon={Phone} title="Contact">
        <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field label="Primary Phone" htmlFor="phone" required>
            <PhoneInput
              id="phone"
              name="phone"
              required
              value={phone}
              onChange={(val) => setPhone(val)}
              placeholder="+91 98765 43210"
            />
          </Field>
          <div>
            <Field label="WhatsApp Number" htmlFor="whatsapp_number" required>
              <PhoneInput
                id="whatsapp_number"
                name={sameAsPrimary ? undefined : "whatsapp_number"}
                required={!sameAsPrimary}
                disabled={sameAsPrimary}
                value={sameAsPrimary ? phone : wa}
                onChange={(val) => setWa(val)}
                placeholder="+91 98765 43210"
              />
              {sameAsPrimary && (
                <input type="hidden" name="whatsapp_number" value={phone} />
              )}
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
                    setWa(phone);
                  }
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

      {isEdit && state?.ok && !isPending && (
        <div
          role="status"
          className="rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-success flex items-center gap-2"
        >
          <Check className="size-4 shrink-0 text-success" />
          <span>Saved</span>
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
