import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  // Open-redirect guard: next must be a same-origin absolute path ("/…"), never "//host" or a URL.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First sign-in: no rider_details row yet → force basic setup before browsing.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rd } = await supabase
          .from("rider_details")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!rd) {
          const dest = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
          return NextResponse.redirect(`${origin}/profile/setup?next=${encodeURIComponent(dest)}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
