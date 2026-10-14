"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type LoginStats = {
  riders: string;
  rides: string;
  km: string;
};

export function LoginForm({ stats }: { stats: LoginStats }) {
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

  const ticker = [
    { value: stats.riders, label: "Riders" },
    { value: stats.rides, label: "Rides" },
    { value: stats.km, label: "Km" },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[55fr_45fr]">
      {/* Visual panel */}
      <div className="relative flex min-h-[38vh] sm:min-h-[46vh] flex-col justify-between overflow-hidden p-4 sm:p-10 lg:min-h-0 lg:p-12">
        <Image
          src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=75"
          alt="Mountain highway winding into the hills at golden hour"
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          priority
          className="animate-ken-burns object-cover object-center opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/60" />

        <Link
          href="/"
          className="relative flex w-fit items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-secondary transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3.5 sm:size-4" aria-hidden />
          Back home
        </Link>

        <div className="relative max-w-xl">
          <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
            Member Portal
          </p>
          <h1 className="animate-fade-in-up mt-2 sm:mt-3 text-2xl sm:text-5xl leading-[1.08] sm:leading-[1.05] font-black tracking-tight">
            Different Roads.
            <br />
            <span className="text-accent drop-shadow-[0_0_30px_rgba(245,158,11,0.35)]">One Community.</span>
          </h1>
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 sm:gap-y-2">
            {ticker.map((s) => (
              <span
                key={s.label}
                className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] sm:tracking-[0.16em] text-white/75 uppercase"
              >
                <span className="text-xs sm:text-sm font-bold text-accent tabular-nums">{s.value}</span>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel — frameless */}
      <div className="relative flex items-center justify-center overflow-hidden border-t border-border bg-bg px-4 py-8 sm:px-6 sm:py-14 lg:border-t-0 lg:border-l">
        <div
          className="absolute -top-32 -right-32 size-80 rounded-full bg-accent/12 blur-[120px]"
          aria-hidden
        />

        <div className="relative w-full max-w-sm space-y-5 sm:space-y-7 text-center">
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
            <img src="/brand/logo-512.png" alt="MotoBharat" className="mx-auto size-12 sm:size-16" />
          </Link>

          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Join the Community</h2>
            <p className="text-xs sm:text-sm text-secondary">
              Sign in with Google to join rides, track your trips, and connect with fellow riders.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger bg-danger/10 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-danger">
              Sign-in failed. Please try again.
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex min-h-[44px] w-full items-center justify-center gap-2.5 sm:gap-3 rounded-lg border border-border-strong bg-surface px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 hover:-translate-y-px hover:border-accent/50 hover:bg-surface-2 hover:shadow-[0_16px_40px_-16px_rgba(245,158,11,0.4)] active:scale-[0.98]"
          >
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-muted">
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
