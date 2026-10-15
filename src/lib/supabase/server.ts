import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseEnv() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    try {
      const globalContext = (
        globalThis as unknown as Record<symbol, { env?: Record<string, string> }>
      )[Symbol.for("__cloudflare-context__")];
      const cfEnv = globalContext?.env;
      if (cfEnv) {
        url = url || cfEnv.NEXT_PUBLIC_SUPABASE_URL;
        key =
          key ||
          cfEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          cfEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    } catch {
      // ignore
    }

    if (!url || !key) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getCloudflareContext } = require("@opennextjs/cloudflare");
        const ctx = getCloudflareContext();
        if (ctx?.env) {
          url = url || ctx.env.NEXT_PUBLIC_SUPABASE_URL;
          key =
            key ||
            ctx.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            ctx.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        }
      } catch {
        // not in Cloudflare runtime or context not initialized
      }
    }
  }

  return { url: url ?? "", key: key ?? "" };
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
