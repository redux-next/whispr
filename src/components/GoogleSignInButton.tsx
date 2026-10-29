
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      router.replace("/dashboard");
    } catch (err: unknown) {
      console.error("Google sign-in failed:", err);

      const errorCode =
        typeof err === "object" &&
        err !== null &&
        "code" in err
          ? String(err.code)
          : "";

      if (errorCode === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (errorCode === "auth/popup-blocked") {
        setError("Your browser blocked the sign-in popup.");
      } else if (errorCode === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase.");
      } else if (
        errorCode === "auth/account-exists-with-different-credential"
      ) {
        setError(
          "An account already exists with this email using another sign-in method."
        );
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <span>Signing in...</span>
        ) : (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              className="h-5 w-5"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.01 13.22l7.98 6.19C11.91 13.72 17.47 9.5 24 9.5Z"
                transform="translate(0 4)"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.63 5.91c4.46-4.12 7.14-10.2 7.14-17.56Z"
              />
              <path
                fill="#FBBC05"
                d="M9.99 28.59A14.4 14.4 0 0 1 9.23 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.58 10.78l7.41-6.19Z"
                transform="translate(0 4)"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.63-5.91c-2.12 1.42-4.84 2.26-8.27 2.26-6.53 0-12.09-4.22-14.01-10.09l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                transform="translate(0 -4)"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
