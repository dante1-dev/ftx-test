"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClientBrowser, isSupabaseConfigured } from "@/lib/supabase-client";
import Image from "next/image";
import Link from "next/link";

function LoginInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const configured = isSupabaseConfigured();

  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const paramError =
    errorParam === "missing_code"
      ? "Google sign-in did not return an authorization code."
      : errorParam === "auth_failed"
        ? "We could not complete Google sign-in. Please try again."
        : errorParam
          ? "Google sign-in failed. Please try again."
          : null;

  const displayError = error || paramError;

  const handleGoogle = useCallback(async () => {
    setError(null);
    if (!configured) {
      setError(
        "Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign in.",
      );
      return;
    }
    const supabase = createClientBrowser();
    if (!supabase) {
      setError("Supabase client is not available.");
      return;
    }
    setPending(true);
    const base =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Unable to start Google sign-in.");
      setPending(false);
    }
  }, [configured, next]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_15px_40px_rgba(0,0,0,0.1)]">
        <div className="mb-6 text-center">
          <Image
            src="/images/logo-default.png"
            alt="Daima Ventures"
            width={180}
            height={60}
            priority
            className="mx-auto"
            style={{ width: "auto", height: 60 }}
          />
          <h1 className="mt-6 text-2xl font-bold text-[#2d4d78]">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-[#666]">
            Access your profile, track applications, and manage your loans.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-sm text-[#721c24]">
            {displayError}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={pending}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-[#e0e0e0] bg-white px-5 py-3.5 text-sm font-semibold text-[#333] shadow-sm transition-all hover:bg-[#f8f9fa] disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.86Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.08 7.93-2.87l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.1-6.72-4.94H1.27v3.1A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.33a7.2 7.2 0 0 1 0-4.66v-3.1H1.27a12 12 0 0 0 0 10.86l4.01-3.1Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.73c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.57l4.01 3.1C6.23 6.83 8.88 4.73 12 4.73Z"
            />
          </svg>
          {pending ? "Redirecting to Google…" : "Continue with Google"}
        </button>

        <div className="mt-6 text-center text-sm text-[#888]">
          <Link href="/" className="font-medium text-[#2d4d78] hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
