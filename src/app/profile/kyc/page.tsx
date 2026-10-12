"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bike, Shield, HeartPulse, FileText, CheckCircle2, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { CustomSelect } from "@/components/ui/custom-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { useFormDraft } from "@/lib/use-form-draft";
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

function SubmitButton({ done }: { done: boolean }) {
  const { pending } = useFormStatus();
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
    <div data-section-card className="rounded-xl border border-border bg-surface p-6 space-y-5 scroll-mt-28">
      <div className="flex items-start gap-3 border-b border-border pb-4">
        <div className="rounded-lg bg-surface-2 p-2.5 text-accent border border-border">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text">{title}</h2>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
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
  const [prefill, setPrefill] = useState<Partial<RiderDetails> | null>(null);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const { updateDraft, getDraftVal, clearDraft } = useFormDraft("motobharat_draft_kyc");
  const lastInvalidRef = useRef<number>(0);
  const serverErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error && serverErrorRef.current) {
      serverErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      serverErrorRef.current.focus();
    }
  }, [state?.error]);

  // Clean up Step 1 draft now that user is on Step 2
  useEffect(() => {
    try {
      localStorage.removeItem("motobharat_draft_setup");
    } catch {}
  }, []);

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
        if (data.registered) {
          clearDraft();
        }
        setDone(data.registered);
        setChecking(false);
      });
  }, [loading, user, router, clearDraft]);

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

  const activeBikeSelection = String(getDraftVal("bike_model", prefill?.bike_model ?? ""));
  const isCustomBike =
    activeBikeSelection === "other" ||
    (Boolean(activeBikeSelection) && !POPULAR_MOTORCYCLES.includes(activeBikeSelection));
  const selectDisplayValue = isCustomBike ? "other" : activeBikeSelection;
  const customBikeValue = String(
    getDraftVal(
      "custom_bike_model",
      prefill?.bike_model && !POPULAR_MOTORCYCLES.includes(prefill.bike_model)
        ? prefill.bike_model
        : ""
    )
  );

  if (loading || checking || !user) {
    return <div className="h-96 animate-pulse rounded-xl bg-surface" />;
  }

  return (
    <form action={formAction} onInvalidCapture={handleInvalid} className="space-y-8">
      {/* Section 1: Motorcycle & Licensing */}
      <SectionCard
        icon={Bike}
        title="1. Motorcycle & Riding Profile"
        subtitle="Your machine, registration plate, and riding experience"
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
                updateDraft("bike_model", val);
                if (val !== "other") {
                  updateDraft("custom_bike_model", "");
                }
              }}
            />
          </Field>
          <Field label="Vehicle Registration / Plate No." htmlFor="bike_reg_no" hint="e.g. TS 03 AB 1234" required>
            <Input
              id="bike_reg_no"
              name="bike_reg_no"
              required
              value={getDraftVal("bike_reg_no", prefill?.bike_reg_no ?? "")}
              onChange={(e) => updateDraft("bike_reg_no", e.target.value)}
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
              onChange={(e) => updateDraft("custom_bike_model", e.target.value)}
              placeholder="e.g. Benelli Imperiale 400"
            />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Driving Licence Number" htmlFor="driving_licence" hint="As on your DL card" required>
            <Input
              id="driving_licence"
              name="driving_licence"
              required
              value={getDraftVal("driving_licence", prefill?.driving_licence ?? "")}
              onChange={(e) => updateDraft("driving_licence", e.target.value)}
              placeholder="TS03 20200001234"
              className="uppercase font-mono"
            />
          </Field>
          <Field label="Vehicle Insurance Status" htmlFor="vehicle_insurance_status" required>
            <CustomSelect
              id="vehicle_insurance_status"
              name="vehicle_insurance_status"
              required
              value={getDraftVal("vehicle_insurance_status", prefill?.vehicle_insurance_status ?? "valid_insured")}
              onChange={(val) => updateDraft("vehicle_insurance_status", val)}
              placeholder="Select insurance status…"
              options={INSURANCE_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Riding Experience Level" htmlFor="experience_level" required>
          <CustomSelect
            id="experience_level"
            name="experience_level"
            required
            value={getDraftVal("experience_level", prefill?.experience_level ?? "")}
            onChange={(val) => updateDraft("experience_level", val)}
            placeholder="Select experience level…"
            options={EXPERIENCE_OPTIONS}
          />
        </Field>

        <Field label="Overall Riding Gear Level" htmlFor="gear_level" required>
          <CustomSelect
            id="gear_level"
            name="gear_level"
            required
            value={getDraftVal("gear_level", prefill?.gear_level ?? "")}
            onChange={(val) => updateDraft("gear_level", val)}
            placeholder="Select gear level…"
            options={GEAR_OPTIONS}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="24x7 Roadside Assistance (RSA) Active?" htmlFor="has_rsa">
            <CustomSelect
              id="has_rsa"
              name="has_rsa"
              value={getDraftVal("has_rsa", prefill?.has_rsa ? "true" : "false")}
              onChange={(val) => updateDraft("has_rsa", val)}
              options={RSA_OPTIONS}
            />
          </Field>
          <Field label="Frequently Ride with Pillion?" htmlFor="rides_with_pillion">
            <CustomSelect
              id="rides_with_pillion"
              name="rides_with_pillion"
              value={getDraftVal("rides_with_pillion", prefill?.rides_with_pillion ? "true" : "false")}
              onChange={(val) => updateDraft("rides_with_pillion", val)}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Blood Group" htmlFor="blood_group" required>
            <CustomSelect
              id="blood_group"
              name="blood_group"
              required
              value={getDraftVal("blood_group", prefill?.blood_group ?? "")}
              onChange={(val) => updateDraft("blood_group", val)}
              placeholder="Select blood group…"
              options={BLOOD_OPTIONS}
            />
          </Field>
          <Field label="Personal Health / Mediclaim Insurance" htmlFor="personal_health_insurance">
            <CustomSelect
              id="personal_health_insurance"
              name="personal_health_insurance"
              value={getDraftVal("personal_health_insurance", prefill?.personal_health_insurance ? "true" : "false")}
              onChange={(val) => updateDraft("personal_health_insurance", val)}
              options={HEALTH_INSURANCE_OPTIONS}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Primary Emergency Contact Name" htmlFor="emergency_contact_name" required>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              required
              value={getDraftVal("emergency_contact_name", prefill?.emergency_contact_name ?? "")}
              onChange={(e) => updateDraft("emergency_contact_name", e.target.value)}
              placeholder="e.g. Ramesh Rao"
            />
          </Field>
          <Field label="Relationship" htmlFor="emergency_contact_relation" hint="e.g. Father, Spouse" required>
            <Input
              id="emergency_contact_relation"
              name="emergency_contact_relation"
              required
              value={getDraftVal("emergency_contact_relation", prefill?.emergency_contact_relation ?? "")}
              onChange={(e) => updateDraft("emergency_contact_relation", e.target.value)}
              placeholder="Father / Spouse / Friend"
            />
          </Field>
          <Field label="Emergency Contact Phone" htmlFor="emergency_contact_phone" required>
            <PhoneInput
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              required
              value={getDraftVal("emergency_contact_phone", prefill?.emergency_contact_phone ?? "")}
              onChange={(val) => updateDraft("emergency_contact_phone", val)}
              placeholder="+91 98765 43210"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Secondary Emergency Contact Phone" htmlFor="emergency_contact_2_phone" hint="Optional backup">
            <PhoneInput
              id="emergency_contact_2_phone"
              name="emergency_contact_2_phone"
              value={getDraftVal("emergency_contact_2_phone", prefill?.emergency_contact_2_phone ?? "")}
              onChange={(val) => updateDraft("emergency_contact_2_phone", val)}
              placeholder="+91 98765 00000"
            />
          </Field>
          <Field label="Known Medical Conditions / Allergies" htmlFor="medical_conditions" hint="Optional — asthma, diabetes, penicillin, etc.">
            <Input
              id="medical_conditions"
              name="medical_conditions"
              value={getDraftVal("medical_conditions", prefill?.medical_conditions ?? "")}
              onChange={(e) => updateDraft("medical_conditions", e.target.value)}
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
            value={getDraftVal("permanent_address", prefill?.permanent_address ?? "")}
            onChange={(e) => updateDraft("permanent_address", e.target.value)}
            placeholder="H.No, Street, Landmark, Warangal, PIN..."
            className="min-h-20"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram Handle" htmlFor="instagram_handle" hint="Without @ symbol">
            <Input
              id="instagram_handle"
              name="instagram_handle"
              value={getDraftVal("instagram_handle", prefill?.instagram_handle ?? "")}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/^@/, "");
                updateDraft("instagram_handle", cleaned);
              }}
              placeholder="rider_warangal"
            />
          </Field>
          <Field label="How did you hear about MotoBharat?" htmlFor="referral_source" hint="Optional">
            <Input
              id="referral_source"
              name="referral_source"
              value={getDraftVal("referral_source", prefill?.referral_source ?? "")}
              onChange={(e) => updateDraft("referral_source", e.target.value)}
              placeholder="Instagram, Friends, WhatsApp..."
            />
          </Field>
        </div>

        <Field label="Suggestions / Expectations" htmlFor="suggestions" hint="Optional">
          <Input
            id="suggestions"
            name="suggestions"
            value={getDraftVal("suggestions", prefill?.suggestions ?? "")}
            onChange={(e) => updateDraft("suggestions", e.target.value)}
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
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 text-xs leading-relaxed text-secondary space-y-2">
          <p className="font-semibold text-text uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-accent" />
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

        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="declaration_confirmed"
              name="declaration_confirmed"
              required
              checked={Boolean(getDraftVal("declaration_confirmed", prefill?.declaration_confirmed ?? false))}
              onChange={(e) => updateDraft("declaration_confirmed", e.target.checked)}
              className="mt-1 size-4 rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-xs text-text font-medium leading-normal">
              I have read, understood, and accept the MotoBharat Warangal Safety Code, traffic discipline rules, and voluntary participation risk waiver.
            </span>
          </label>
        </div>

        <Field
          label="Full Name / Digital Signature"
          htmlFor="digital_signature"
          hint="Type your full legal name as your digital signature"
          required
        >
          <Input
            id="digital_signature"
            name="digital_signature"
            required
            value={getDraftVal("digital_signature", prefill?.digital_signature ?? profile?.display_name ?? "")}
            onChange={(e) => updateDraft("digital_signature", e.target.value)}
            placeholder="Your Full Name"
          />
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

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
        <Link href="/" className="text-xs text-muted hover:text-secondary">
          Cancel / Return Home
        </Link>
        <SubmitButton done={done} />
      </div>

      <p className="border-t border-border pt-4 text-xs text-muted text-center sm:text-left">
        Your safety & emergency data is private and accessible only to verified club administrators and organizers in case of road incidents.
      </p>
    </form>
  );
}

export default function ProfileKycPage() {
  return (
    <div className="min-h-[80vh] px-4 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-3">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Rider Registration · Step 2
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Rider Safety & KYC</h1>
          <p className="text-sm text-secondary leading-relaxed">
            Complete your vehicle details, emergency contacts, and sign the safety waiver.
            Once completed, your profile is marked as <span className="text-accent font-semibold">Registered</span> and you can freely join any community ride.
          </p>
        </div>
        <KycForm />
      </div>
    </div>
  );
}

