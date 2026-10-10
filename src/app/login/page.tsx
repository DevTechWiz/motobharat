"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Users, ShieldCheck, Images } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const perks = [
  { icon: Users, text: "Community rides from Warangal — single-day and multi-day." },
  { icon: ShieldCheck, text: "One-time rider KYC so admins know who is in the column." },
  { icon: Images, text: "Ride galleries, announcements, and safety updates." },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center px-4 py-16">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between p-10 lg:flex">
          <div
            className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-accent/12 blur-[110px]"
            aria-hidden
          />
          <div className="relative">
            <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
              Member Portal
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-black tracking-tight">
              Different Roads.
              <br />
              <span className="text-accent">One Community.</span>
            </h2>
          </div>
          <ul className="relative space-y-4">
            {perks.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-sm text-secondary">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <p.icon className="size-4 text-accent" aria-hidden />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
          <p className="relative font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            Free to join · 18+ · Warangal, Telangana
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8 border-t border-border p-8 sm:p-10 lg:border-t-0 lg:border-l">
          <div className="space-y-4 text-center">
            <Link href="/" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-512.png" alt="MotoBharat" className="mx-auto size-20" />
            </Link>
            <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase lg:hidden">
              Member Portal
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">Join the Community</h1>
            <p className="text-sm text-secondary">
              Sign in with Google to join rides, track your trips, and connect with fellow riders.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger bg-danger/10 px-4 py-3 text-sm text-danger">
              Sign-in failed. Please try again.
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border-strong bg-surface px-6 py-4 text-sm font-bold tracking-wider uppercase transition-colors hover:bg-surface-2"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-muted">
            By signing in you agree to ride responsibly and follow our{" "}
            <Link href="/safety" className="text-accent hover:underline">
              Safety Code
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
