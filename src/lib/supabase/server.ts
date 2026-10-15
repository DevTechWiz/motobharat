import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getSupabaseEnv() {
  let cfEnv: Record<string, string | undefined> | undefined;
  try {
    const ctx = getCloudflareContext();
    cfEnv = ctx?.env as unknown as Record<string, string | undefined>;
  } catch {
    // not in Cloudflare Worker context (e.g. local dev or test environment)
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    cfEnv?.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    cfEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    cfEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return { url, key };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from Server Component — safe to ignore when middleware refreshes sessions
          }
        },
      },
    },
  );
}
