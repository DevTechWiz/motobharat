import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
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

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // refresh session — must run before any code that uses the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // component gallery is dev-only (00_OVERVIEW: dev-only unlinked routes)
  if (path === "/dev/ui" && process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  // Logged-in users should not see /login
  if (path === "/login" && user) {
    const rawNext = request.nextUrl.searchParams.get("next") ?? "/profile";
    const dest = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/profile";
    const url = request.nextUrl.clone();
    url.pathname = dest;
    url.search = "";
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  const isProtected = path.startsWith("/admin") || path.startsWith("/profile");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  // organizers only for /admin
  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const res = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
      return res;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
