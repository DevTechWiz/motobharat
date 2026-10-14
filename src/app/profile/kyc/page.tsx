"use client";

import { useActionState, useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Bike, Shield, ShieldAlert, HeartPulse, FileText, CheckCircle2, ArrowLeft, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RegSteps } from "../reg-steps";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { PhotoPicker } from "@/components/ui/photo-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { saveRiderDetails, type ProfileFormState } from "../actions";
import type { RiderDetails } from "@/lib/types";
import { MOTORCYCLES_BY_BRAND, POPULAR_MOTORCYCLES } from "@/lib/motorcycles";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const BLOOD_OPTIONS = BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg }));

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", sublabel: "< 1 yr touring / local runs" },
  { value: "intermediate", label: "Intermediate", sublabel: "1–3 yrs / highway group rides" },
  { value: "experienced", label: "Experienced", sublabel: "3+ yrs / long distance endurance" },
];

const GEAR_OPTIONS = [
  {
    value: "full_armored",
    label: "Full Armored",
    sublabel: "Jacket + Pants/Knees + Boots + Certified Helmet + Gloves",
  },
  {
    value: "basic",
    label: "Basic Riding Gear",
    sublabel: "Riding Jacket + Helmet + Gloves",
  },
  {
    value: "helmet_only",
    label: "Certified Helmet Only",
    sublabel: "Upgrade required for long highway runs",
  },
];

const INSURANCE_OPTIONS = [
  { value: "valid_insured", label: "Comprehensive / Third-Party", sublabel: "Active & Valid Insurance" },
  { value: "expired", label: "Expired", sublabel: "Needs renewal" },
  { value: "none", label: "None", sublabel: "No active vehicle insurance" },
];

const RSA_OPTIONS = [
  { value: "false", label: "No RSA cover", sublabel: "Self-managed roadside recovery" },
  { value: "true", label: "Active 24x7 RSA", sublabel: "Active OEM or third-party towing policy" },
];

const PILLION_OPTIONS = [
  { value: "false", label: "Solo rider only", sublabel: "No passenger during group rides" },
  { value: "true", label: "Frequently bring pillion", sublabel: "Riding two-up" },
];

const HEALTH_INSURANCE_OPTIONS = [
  { value: "false", label: "No / None", sublabel: "No private mediclaim policy" },
  { value: "true", label: "Active Mediclaim", sublabel: "Active health or accidental insurance policy" },
];

function SubmitButton({ done, pending }: { done: boolean; pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving Registration..." : done ? "Update KYC Details" : "Submit & Complete Registration"}
    </Button>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div data-section-card className="rounded-xl sm:rounded-2xl border border-border bg-surface p-3 sm:p-5 space-y-3 sm:space-y-4 scroll-mt-28">
      <div className="flex items-start gap-2 sm:gap-2.5 border-b border-border pb-2.5 sm:pb-3.5">
        <div className="rounded-lg bg-surface-2 p-1.5 sm:p-2 text-accent border border-border shrink-0">
          <Icon className="size-4 sm:size-4.5" />
        </div>
        <div>
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-text">{title}</h2>
          <p className="text-[10px] sm:text-xs text-muted mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function KycForm() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [state, formAction] = useActionState(saveRiderDetails, {} as ProfileFormState);
  const [isPending, startTransition] = useTransition();
  const [prefill, setPrefill] = useState<Partial<RiderDetails> | null>(null);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);
  // Ephemeral UI state only (never persisted): custom-bike toggle.
  const [bikeSel, setBikeSel] = useState<string | null>(null);
  const [customBikeSel, setCustomBikeSel] = useState<string | null>(null);
  const lastInvalidRef = useRef<number>(0);
  const serverErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error && serverErrorRef.current) {
      serverErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      serverErrorRef.current.focus();
    }
  }, [state?.error]);

  useEffect(() => {
    if (loading || !user) return;
    const supabase = createClient();
    supabase
      .from("rider_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        // Basic info must exist first — bounce to setup.
        if (!data?.age || !data?.gender || !data?.phone) {
          router.replace("/profile/setup");
          return;
        }
        setPrefill(data);
        setDone(data.registered);
        setChecking(false);
      });
  }, [loading, user, router]);

  const frozen = Boolean(prefill?.kyc_submitted_at && !prefill?.registered && !prefill?.kyc_rejected);

  useEffect(() => {
    if (state?.ok) {
      router.push("/profile");
    }
  }, [state?.ok, router]);

  const handleInvalid = (e: React.FormEvent<HTMLFormElement>) => {
    const now = Date.now();
    if (now - lastInvalidRef.current < 800) return;
    lastInvalidRef.current = now;

    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target) return;

    // After the scroll finishes, trigger the native validation tooltip warning
    setTimeout(() => {
      try {
        target.reportValidity();
      } catch {}
    }, 450);
  };

  const activeBikeSelection = bikeSel ?? prefill?.bike_model ?? "";
  const isCustomBike =
    activeBikeSelection === "other" ||
    (Boolean(activeBikeSelection) && !POPULAR_MOTORCYCLES.includes(activeBikeSelection));
  const selectDisplayValue = isCustomBike ? "other" : activeBikeSelection;
  const customBikeValue =
    customBikeSel ??
    (prefill?.bike_model && !POPULAR_MOTORCYCLES.includes(prefill.bike_model) ? prefill.bike_model : "");
  const locked = prefill?.registered ?? false;

  if (loading || checking || !user) {
    return <div className="h-96 animate-pulse rounded-xl bg-surface" />;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => formAction(new FormData(e.currentTarget)));
      }}
      onInvalidCapture={handleInvalid}
    >
      <fieldset disabled={frozen || isPending} className="min-w-0 space-y-3.5 sm:space-y-6 border-0 m-0 p-0">
      {prefill?.kyc_rejected && !prefill?.registered && (
        <div className="flex items-start gap-2.5 sm:gap-3 rounded-lg border border-danger/40 bg-danger/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-text">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p className="leading-relaxed">
            An admin reviewed your KYC and sent it back — most often the profile photo, DL photo
            or typed name don&apos;t match. Fix the details below and resubmit.
          </p>
        </div>
      )}
      {frozen && (
        <div className="flex items-start gap-2.5 sm:gap-3 rounded-lg border border-accent/40 bg-accent/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-text">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p className="leading-relaxed">
            Submitted — under admin review. The form is locked until the verdict; what you see is
            exactly what&apos;s filed.
          </p>
        </div>
      )}
      {/* Section 1: Motorcycle & Licensing */}
      <SectionCard
        icon={Bike}
        title="1. Motorcycle & Riding Profile"
        subtitle="Your machine, registration plate, and riding experience"
      >
        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field label="Motorcycle Brand & Model" htmlFor="bike_model" required>
            <CustomSelect
              id="bike_model"
              name="bike_model"
              required
              value={selectDisplayValue}
              placeholder="Select motorcycle brand & model…"
              searchable
              groups={MOTORCYCLES_BY_BRAND}
              options={[{ value: "other", label: "Other / Custom Model" }]}
              onChange={(val) => {
                setBikeSel(val);
                if (val !== "other") {
                  setCustomBikeSel("");
                }
              }}
            />
          </Field>
          <Field label="Vehicle Registration / Plate No." htmlFor="bike_reg_no" hint="e.g. TS 03 AB 1234" required>
            <Input
              id="bike_reg_no"
              name="bike_reg_no"
              required
              defaultValue={prefill?.bike_reg_no ?? ""}
              placeholder="TS 03 AB 1234"
              className="uppercase font-mono"
            />
          </Field>
        </div>

        {isCustomBike && (
          <Field
            label="Specify Motorcycle Brand & Model"
            htmlFor="custom_bike_model"
            hint="Enter your motorcycle make and model"
            required
          >
            <Input
              id="custom_bike_model"
              name="custom_bike_model"
              required
              value={customBikeValue}
              onChange={(e) => setCustomBikeSel(e.target.value)}
              placeholder="e.g. Benelli Imperiale 400"
            />
          </Field>
        )}

        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field
            label="Driving Licence Number"
            htmlFor="driving_licence"
            hint={locked && prefill?.driving_licence ? "Locked after approval — contact an admin to correct" : "As on your DL card"}
            required
          >
            {locked && prefill?.driving_licence ? (
              <Input
                id="driving_licence"
                name="driving_licence"
                required
                disabled
                value={prefill.driving_licence}
                placeholder="TS03 20200001234"
                className="uppercase font-mono"
              />
            ) : (
              <Input
                id="driving_licence"
                name="driving_licence"
                required
                defaultValue={prefill?.driving_licence ?? ""}
                placeholder="TS03 20200001234"
                className="uppercase font-mono"
              />
            )}
          </Field>
          <Field label="Vehicle Insurance Status" htmlFor="vehicle_insurance_status" required>
            <CustomSelect
              id="vehicle_insurance_status"
              name="vehicle_insurance_status"
              required
              defaultValue={prefill?.vehicle_insurance_status ?? "valid_insured"}
              placeholder="Select insurance status…"
              options={INSURANCE_OPTIONS}
            />
          </Field>
        </div>

        {locked ? (
          prefill?.dl_image_url ? (
            <div>
              <p className="mb-1.5 flex items-center justify-between text-xs font-bold tracking-wider text-secondary uppercase">
                <span>Driving Licence Photo</span>
              </p>
              <div className="overflow-hidden rounded-xl border border-border bg-surface-2">
                <Image
                  src={prefill.dl_image_url}
                  alt="Your driving licence photo on file"
                  width={1200}
                  height={800}
                  sizes="(min-width:768px) 640px, 100vw"
                  className="h-auto w-full object-contain opacity-90"
                />
                <p className="border-t border-border px-4 py-2 font-mono text-[10px] tracking-wider text-muted uppercase">
                  Locked after approval — contact an admin to correct
                </p>
              </div>
            </div>
          ) : null
        ) : prefill?.dl_image_url ? (
          <div>
            <p className="mb-1.5 flex items-center justify-between text-xs font-bold tracking-wider text-secondary uppercase">
              <span>Driving Licence Photo</span>
            </p>
            <PhotoPicker
              id="dl_document"
              name="dl_document"
              existingUrl={prefill.dl_image_url}
            />
          </div>
        ) : (
          <Field
            label="Driving Licence Photo"
            htmlFor="dl_document"
            hint="Clear photo of your DL card (JPEG/WebP, max 10 MB). Checked once at approval, then deleted — only the number is kept."
            required
          >
            <PhotoPicker id="dl_document" name="dl_document" required />
          </Field>
        )}

        <Field label="Riding Experience Level" htmlFor="experience_level" required>
          <CustomSelect
            id="experience_level"
            name="experience_level"
            required
            defaultValue={prefill?.experience_level ?? ""}
            placeholder="Select experience level…"
            options={EXPERIENCE_OPTIONS}
          />
        </Field>

        <Field label="Overall Riding Gear Level" htmlFor="gear_level" required>
          <CustomSelect
            id="gear_level"
            name="gear_level"
            required
            defaultValue={prefill?.gear_level ?? ""}
            placeholder="Select gear level…"
            options={GEAR_OPTIONS}
          />
        </Field>

        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field label="24x7 Roadside Assistance (RSA) Active?" htmlFor="has_rsa">
            <CustomSelect
              id="has_rsa"
              name="has_rsa"
              defaultValue={prefill?.has_rsa ? "true" : "false"}
              options={RSA_OPTIONS}
            />
          </Field>
          <Field label="Frequently Ride with Pillion?" htmlFor="rides_with_pillion">
            <CustomSelect
              id="rides_with_pillion"
              name="rides_with_pillion"
              defaultValue={prefill?.rides_with_pillion ? "true" : "false"}
              options={PILLION_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Section 2: Emergency & Life Safety */}
      <SectionCard
        icon={HeartPulse}
        title="2. Emergency Safety & Medical Info"
        subtitle="Used strictly by ride marshals and medical teams in case of an incident"
      >
        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field
            label="Blood Group"
            htmlFor="blood_group"
            hint={locked && prefill?.blood_group ? "Locked after approval" : undefined}
            required
          >
            {locked && prefill?.blood_group ? (
              <CustomSelect
                id="blood_group"
                name="blood_group"
                required
                disabled
                value={prefill.blood_group}
                placeholder="Select blood group…"
                options={BLOOD_OPTIONS}
              />
            ) : (
              <CustomSelect
                id="blood_group"
                name="blood_group"
                required
                defaultValue={prefill?.blood_group ?? ""}
                placeholder="Select blood group…"
                options={BLOOD_OPTIONS}
              />
            )}
          </Field>
          <Field label="Personal Health / Mediclaim Insurance" htmlFor="personal_health_insurance">
            <CustomSelect
              id="personal_health_insurance"
              name="personal_health_insurance"
              defaultValue={prefill?.personal_health_insurance ? "true" : "false"}
              options={HEALTH_INSURANCE_OPTIONS}
            />
          </Field>
        </div>

        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-3">
          <Field label="Primary Emergency Contact Name" htmlFor="emergency_contact_name" required>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              required
              defaultValue={prefill?.emergency_contact_name ?? ""}
              placeholder="e.g. Ramesh Rao"
            />
          </Field>
          <Field label="Relationship" htmlFor="emergency_contact_relation" hint="e.g. Father, Spouse" required>
            <Input
              id="emergency_contact_relation"
              name="emergency_contact_relation"
              required
              defaultValue={prefill?.emergency_contact_relation ?? ""}
              placeholder="Father / Spouse / Friend"
            />
          </Field>
          <Field label="Emergency Contact Phone" htmlFor="emergency_contact_phone" required>
            <PhoneInput
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              required
              defaultValue={prefill?.emergency_contact_phone ?? ""}
              placeholder="+91 98765 43210"
            />
          </Field>
        </div>

        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field label="Secondary Emergency Contact Phone" htmlFor="emergency_contact_2_phone" hint="Optional backup">
            <PhoneInput
              id="emergency_contact_2_phone"
              name="emergency_contact_2_phone"
              defaultValue={prefill?.emergency_contact_2_phone ?? ""}
              placeholder="+91 98765 00000"
            />
          </Field>
          <Field label="Known Medical Conditions / Allergies" htmlFor="medical_conditions" hint="Optional — asthma, diabetes, penicillin, etc.">
            <Input
              id="medical_conditions"
              name="medical_conditions"
              defaultValue={prefill?.medical_conditions ?? ""}
              placeholder="e.g. Asthmatic, No known drug allergies"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Section 3: Community & Address */}
      <SectionCard
        icon={Shield}
        title="3. Community Details & Address"
        subtitle="Optional background info for the Warangal riders community"
      >
        <Field label="Permanent House Address" htmlFor="permanent_address" hint="Optional">
            <Textarea
              id="permanent_address"
              name="permanent_address"
              defaultValue={prefill?.permanent_address ?? ""}
              placeholder="H.No, Street, Landmark, Warangal, PIN..."
              className="min-h-20"
            />
        </Field>

        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Field label="Instagram Handle" htmlFor="instagram_handle" hint="Without @ symbol">
            <Input
              id="instagram_handle"
              name="instagram_handle"
              defaultValue={prefill?.instagram_handle ?? ""}
              placeholder="rider_warangal"
            />
          </Field>
          <Field label="How did you hear about MotoBharat?" htmlFor="referral_source" hint="Optional">
            <Input
              id="referral_source"
              name="referral_source"
              defaultValue={prefill?.referral_source ?? ""}
              placeholder="Instagram, Friends, WhatsApp..."
            />
          </Field>
        </div>

        <Field label="Suggestions / Expectations" htmlFor="suggestions" hint="Optional">
            <Input
              id="suggestions"
              name="suggestions"
              defaultValue={prefill?.suggestions ?? ""}
              placeholder="What kind of rides or destinations are you looking forward to?"
            />
        </Field>
      </SectionCard>

      {/* Section 4: Safety Code & Risk Waiver */}
      <SectionCard
        icon={FileText}
        title="4. Safety Code & Risk Waiver"
        subtitle="Mandatory confirmation before riding with the column"
      >
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed text-secondary space-y-1.5 sm:space-y-2">
          <p className="font-semibold text-text uppercase tracking-wide flex items-center gap-1.5 text-[11px] sm:text-xs">
            <CheckCircle2 className="size-3.5 sm:size-4 text-accent" />
            Declaration & Undertaking
          </p>
          <p>
            &ldquo;I confirm that the information provided by me is true and correct. I understand that
            motorcycle riding and group rides involve inherent risks. I agree to follow traffic laws, wear
            proper safety gear, ride responsibly, and follow the instructions of the ride organizers. I
            voluntarily participate in Motobharat_Warangal rides and accept responsibility for my own safety
            and actions.&rdquo;
          </p>
        </div>

        <div className="pt-1 sm:pt-2">
          <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="declaration_confirmed"
              name="declaration_confirmed"
              required
              defaultChecked={prefill?.declaration_confirmed ?? false}
              className="mt-0.5 size-4 rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-[11px] sm:text-xs text-text font-medium leading-snug">
              I have read, understood, and accept the MotoBharat Warangal Safety Code, traffic discipline rules, and voluntary participation risk waiver.
            </span>
          </label>
        </div>

        <Field
          label="Full Name / Digital Signature"
          htmlFor="digital_signature"
          hint={
            locked && prefill?.digital_signature
              ? "Locked after approval — contact an admin to correct"
              : "Type your full legal name exactly as printed on your driving licence — an admin cross-checks both"
          }
          required
        >
          {locked && prefill?.digital_signature ? (
            <Input
              id="digital_signature"
              name="digital_signature"
              required
              disabled
              value={prefill.digital_signature}
              placeholder="Your Full Name"
            />
          ) : (
            <Input
              id="digital_signature"
              name="digital_signature"
              required
              defaultValue={prefill?.digital_signature ?? profile?.display_name ?? ""}
              placeholder="Your Full Name"
            />
          )}
        </Field>
      </SectionCard>

      {state?.error && (
        <div
          ref={serverErrorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger scroll-mt-28 flex items-center gap-2.5 outline-none"
        >
          <span className="size-2 rounded-full bg-danger shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-2">
        <Link
          href={done ? "/profile" : "/profile/setup"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {done ? "Back to profile" : "Back to basic info"}
        </Link>
        <SubmitButton done={done} pending={isPending} />
      </div>

      <p className="border-t border-border pt-3 sm:pt-4 text-[11px] sm:text-xs text-muted text-center sm:text-left">
        Your safety & emergency data is private and accessible only to verified club administrators and organizers in case of road incidents.
      </p>
      </fieldset>
    </form>
  );
}

export default function ProfileKycPage() {
  return (
    <div className="min-h-[80vh] px-3 sm:px-4 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-3.5 sm:space-y-6">
        <RegSteps current={2} />
        <div className="space-y-1 sm:space-y-2">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Rider Registration · Step 2
          </p>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">Rider Safety & KYC</h1>
          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Complete your vehicle details, emergency contacts, and sign the safety waiver.
            Once submitted, an admin reviews your application — approval marks you{" "}
            <span className="text-accent font-semibold">Registered</span> and unlocks joining any community ride.
          </p>
        </div>
        <KycForm />
      </div>
    </div>
  );
}

