"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";
import { saveRiderDetails, type ProfileFormState } from "../actions";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function SubmitButton({ done }: { done: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : done ? "Update KYC" : "Complete Registration"}
    </Button>
  );
}

function KycForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [state, formAction] = useActionState(saveRiderDetails, {} as ProfileFormState);
  const [prefill, setPrefill] = useState<Record<string, string> | null>(null);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);

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
        if (!data?.age || !data?.gender) {
          router.replace("/profile/setup");
          return;
        }
        setPrefill({
          phone: data.phone ?? "",
          blood_group: data.blood_group ?? "",
          emergency_contact_name: data.emergency_contact_name ?? "",
          emergency_contact_phone: data.emergency_contact_phone ?? "",
          bike_model: data.bike_model ?? "",
        });
        setDone(data.registered);
        setChecking(false);
      });
  }, [loading, user, router]);

  if (loading || checking || !user) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone (WhatsApp)" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={prefill?.phone}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="Blood Group" htmlFor="blood_group">
          <Select id="blood_group" name="blood_group" required defaultValue={prefill?.blood_group ?? ""}>
            <option value="" disabled>
              Select…
            </option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Emergency Contact Name" htmlFor="emergency_contact_name">
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            required
            defaultValue={prefill?.emergency_contact_name}
            placeholder="Family member"
          />
        </Field>
        <Field label="Emergency Contact Phone" htmlFor="emergency_contact_phone">
          <Input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            type="tel"
            required
            defaultValue={prefill?.emergency_contact_phone}
            placeholder="+91 98765 43210"
          />
        </Field>
      </div>

      <Field label="Bike Model" htmlFor="bike_model" hint="Your usual ride on community runs">
        <Input
          id="bike_model"
          name="bike_model"
          required
          defaultValue={prefill?.bike_model}
          placeholder="Himalayan 450"
        />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <Link href="/" className="text-xs text-muted hover:text-secondary">
          Skip for now
        </Link>
        <SubmitButton done={done} />
      </div>

      <p className="border-t border-border pt-4 text-xs text-muted">
        Used for ride safety only — seen by admins in case of an incident, never made public.
        Required before you can join any ride.
      </p>
    </form>
  );
}

export default function ProfileKycPage() {
  return (
    <div className="flex min-h-[80vh] items-center px-4 py-16">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="space-y-3">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Rider Registration · Step 2
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Rider KYC</h1>
          <p className="text-sm text-secondary">
            Safety details for the column. Completing this marks your profile registered and
            unlocks ride joining.
          </p>
        </div>
        <KycForm />
      </div>
    </div>
  );
}
