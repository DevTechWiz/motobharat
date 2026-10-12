import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegSteps } from "../reg-steps";
import { SetupForm } from "./setup-form";
import type { RiderDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rider Setup · Step 1", robots: { index: false } };

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; edit?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;

  if (!user) {
    const next = params.next ?? "/profile/setup";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, city")
    .eq("id", user.id)
    .maybeSingle();

  const { data: rd } = await supabase
    .from("rider_details")
    .select("age, dob, gender, phone, whatsapp_number, occupation")
    .eq("user_id", user.id)
    .maybeSingle();

  const isEdit = params.edit === "true";

  // If basic info is already filled and user isn't intentionally editing it, redirect to KYC immediately on the server with zero client jump!
  if (rd?.age && rd?.gender && rd?.phone && !isEdit) {
    redirect("/profile/kyc");
  }

  return (
    <div className="flex min-h-[80vh] items-center px-4 py-12">
      <div className="mx-auto w-full max-w-xl space-y-6 animate-fade-in-up">
        <RegSteps current={1} />
        <div className="space-y-2">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            {isEdit ? "Rider Profile" : "Rider Registration · Step 1 of 2"}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isEdit ? "Edit basic details" : "Tell us about yourself"}
          </h1>
          <p className="text-sm text-secondary">
            {isEdit
              ? "Update your personal info — saving returns you to your profile."
              : "Basic details for the rider column. Under a minute — then one quick safety step."}
          </p>
        </div>
        <SetupForm
          initialData={rd as Partial<RiderDetails> | null}
          profile={profile}
          isEdit={isEdit}
        />
      </div>
    </div>
  );
}
