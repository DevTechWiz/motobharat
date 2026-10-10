"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";
import { saveBasicProfile, type ProfileFormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save & Continue"}
    </Button>
  );
}

function SetupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [state, formAction] = useActionState(saveBasicProfile, {} as ProfileFormState);

  // Already completed setup? (e.g. bookmarked the page) → send to KYC.
  useEffect(() => {
    if (loading || !user) return;
    const supabase = createClient();
    supabase
      .from("rider_details")
      .select("age, gender")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.age && data?.gender) router.replace("/profile/kyc");
      });
  }, [loading, user, router]);

  if (loading) {
    return <div className="mx-auto h-64 max-w-md animate-pulse rounded-xl bg-surface" />;
  }

  if (!user) {
    const next = searchParams.get("next") ?? "/profile/setup";
    router.replace(`/login?next=${encodeURIComponent(next)}`);
    return null;
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <Field label="Full Name" htmlFor="display_name">
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile?.display_name ?? ""}
          required
          maxLength={50}
          placeholder="As you want it on ride lists"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Age" htmlFor="age" hint="18+ required">
          <Input id="age" name="age" type="number" min={18} max={90} required placeholder="26" />
        </Field>
        <Field label="Gender" htmlFor="gender">
          <Select id="gender" name="gender" required defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </Select>
        </Field>
      </div>

      <Field label="City" htmlFor="city" hint="Optional — shown on your public profile">
        <Input id="city" name="city" defaultValue={profile?.city ?? ""} placeholder="Warangal" />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <Link href="/" className="text-xs text-muted hover:text-secondary">
          Skip for now
        </Link>
        <SubmitButton />
      </div>

      <p className="border-t border-border pt-4 text-xs text-muted">
        Step 1 of 2 — basic info. Next: rider KYC (blood group, emergency contact) required
        before joining rides.
      </p>
    </form>
  );
}

export default function ProfileSetupPage() {
  return (
    <div className="flex min-h-[80vh] items-center px-4 py-16">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="space-y-3">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Rider Registration · Step 1
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Tell us about yourself</h1>
          <p className="text-sm text-secondary">
            Basic details for the rider column. This takes under a minute — then one more quick
            step for safety info.
          </p>
        </div>
        <Suspense>
          <SetupForm />
        </Suspense>
      </div>
    </div>
  );
}
