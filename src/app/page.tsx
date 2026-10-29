
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  const checkAuthentication = useCallback(() => {
    setChecking(true);
    setAuthError("");

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      },
      (error) => {
        console.error("Authentication state error:", error);
        setAuthError("We couldn't check your sign-in status.");
        setChecking(false);
      },
    );

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    return checkAuthentication();
  }, [checkAuthentication]);

  if (authError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0912] px-6 text-white">
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 text-4xl text-purple-300">✳</div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            {authError} Check your connection and try again.
          </p>

          <button
            type="button"
            onClick={() => {
              setAuthError("");
              setChecking(true);
              window.location.reload();
            }}
            className="mt-6 rounded-xl bg-purple-300 px-5 py-3 text-sm font-bold text-[#171020] transition hover:bg-purple-200"
          >
            Try again
          </button>

          <div className="mt-5">
            <Link
              href="/login"
              className="text-sm text-purple-300 hover:text-purple-200"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#0b0912] px-6 text-white"
      aria-live="polite"
    >
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-purple-300/20 bg-purple-300/10 text-3xl text-purple-300">
          ✳
        </div>

        <p className="text-2xl font-extrabold tracking-tight">
          whispr<span className="text-purple-300">.</span>
        </p>

        <div
          className="mx-auto mt-7 h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-purple-300"
          role="status"
          aria-label="Checking sign-in status"
        />

        <p className="mt-4 text-sm text-white/55">
          {checking ? "Finding your space..." : "Redirecting..."}
        </p>
      </div>
    </main>
  );
}
