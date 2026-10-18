import { createClient } from "@/lib/supabase/server";
import { RidersExplorer, type RiderRow } from "./riders-explorer";

export const dynamic = "force-dynamic";

// Admin rider directory (admin eyes only — proxy gates /admin).
export default async function AdminRidersPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: details }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, city, role")
      .order("display_name"),
    supabase
      .from("rider_details")
      .select("user_id, registered, dl_image_url, kyc_submitted_at, kyc_rejected, member_type"),
  ]);

  const detailsByUser = new Map(
    ((details ?? []) as {
      user_id: string;
      registered: boolean | null;
      dl_image_url: string | null;
      kyc_submitted_at: string | null;
      kyc_rejected: boolean | null;
      member_type: string | null;
    }[]).map((d) => [d.user_id, d])
  );

  const riders: RiderRow[] = ((profiles ?? []) as {
    id: string;
    display_name: string;
    avatar_url: string | null;
    city: string | null;
    role: string;
  }[]).map((r) => {
    const d = detailsByUser.get(r.id);
    return {
      id: r.id,
      display_name: r.display_name,
      avatar_url: r.avatar_url,
      city: r.city,
      role: r.role,
      registered: d?.registered ?? false,
      submitted: Boolean(d?.kyc_submitted_at),
      rejected: d?.kyc_rejected ?? false,
      hasDoc: Boolean(d?.dl_image_url),
      member_type: d?.member_type ?? "rider",
    };
  });

  return <RidersExplorer riders={riders} />;
}
