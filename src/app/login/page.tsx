"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User,
} from "firebase/auth";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import "./login.css";

function createBaseUsername(name: string, email: string) {
  const source = name || email.split("@")[0] || "whisper";
  const cleaned = source
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 18);

  return cleaned || "whisper";
}

async function ensureUserProfile(
  user: User,
  requestedUsername?: string,
) {
  const profileRef = doc(db, "profiles", user.uid);
  const email = user.email ?? "";
  const displayName =
    user.displayName || email.split("@")[0] || "Whispr user";

  const baseUsername = createBaseUsername(displayName, email);
  const desiredUsername = requestedUsername?.trim().toLowerCase();

  if (
    desiredUsername &&
    !/^[a-z0-9_]{3,20}$/.test(desiredUsername)
  ) {
    throw new Error(
      "Username must be 3–20 characters using letters, numbers, or underscores.",
    );
  }

  await runTransaction(db, async (transaction) => {
    const existingProfile = await transaction.get(profileRef);

    if (existingProfile.exists()) {
      const existingData = existingProfile.data();
      const existingUsername = existingData.username;

      if (
        desiredUsername &&
        desiredUsername !== existingUsername
      ) {
        throw new Error("ACCOUNT_ALREADY_EXISTS");
      }

      transaction.set(
        profileRef,
        {
          email,
          displayName,
          photoURL: user.photoURL ?? null,
          inboxEnabled: existingData.inboxEnabled !== false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      return;
    }

    let username = desiredUsername || baseUsername;
    let usernameRef = doc(db, "usernames", username);
    let usernameSnapshot = await transaction.get(usernameRef);

    if (desiredUsername && usernameSnapshot.exists()) {
      throw new Error("USERNAME_TAKEN");
    }

    let suffix = 1;

    while (!desiredUsername && usernameSnapshot.exists()) {
      username = `${baseUsername}${suffix}`;
      usernameRef = doc(db, "usernames", username);
      usernameSnapshot = await transaction.get(usernameRef);
      suffix += 1;

      if (suffix > 100) {
        throw new Error("USERNAME_UNAVAILABLE");
      }
    }

    transaction.set(usernameRef, {
      uid: user.uid,
      createdAt: serverTimestamp(),
    });

    transaction.set(profileRef, {
      uid: user.uid,
      email,
      displayName,
      username,
      photoURL: user.photoURL ?? null,
      inboxEnabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

function getFriendlyError(error: unknown) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  if (error instanceof Error) {
    if (error.message === "USERNAME_TAKEN") {
      return "That username is already taken. Please choose another.";
    }

    if (error.message === "USERNAME_UNAVAILABLE") {
      return "We couldn't find an available username. Please try again.";
    }

    if (error.message === "ACCOUNT_ALREADY_EXISTS") {
      return "This account already exists. Please sign in instead.";
    }

    if (error.message.startsWith("Username must be")) {
      return error.message;
    }
  }

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/email-already-in-use":
      return "An account with this email already exists.";

    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";

    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed.";

    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup.";

    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase sign-in.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";

    case "permission-denied":
    case "firestore/permission-denied":
      return "Firestore denied access. Check your Firebase security rules.";

    default:
      return error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
  }
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      width="20"
      height="20"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
        transform="translate(0 4)"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.65 5.93c4.47-4.13 7.13-10.2 7.13-17.58Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.98 23.98 0 0 0 0 21.56l7.98-6.19Z"
        transform="translate(0 4)"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.9-5.78l-7.65-5.93c-2.13 1.43-4.85 2.28-8.25 2.28-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
        transform="translate(0 -4)"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [requestedUsername, setRequestedUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finishSignIn(
    user: User,
    customUsername?: string,
    isNewRegistration = false,
  ) {
    await ensureUserProfile(user, customUsername);

    // The dashboard reads this flag and shows the welcome popup.
    // Only new registrations should set it.
    if (isNewRegistration) {
      sessionStorage.setItem("whispr_show_developer_intro", "1");
    }

    router.replace("/dashboard");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (mode === "signup") {
      const normalizedUsername = requestedUsername.trim().toLowerCase();

      if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
        setError(
          "Username must be 3–20 characters using letters, numbers, or underscores.",
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

        if (name.trim()) {
          await updateProfile(credential.user, {
            displayName: name.trim(),
          });
        }

        await finishSignIn(
          credential.user,
          requestedUsername.trim().toLowerCase(),
          true,
        );
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

        await finishSignIn(credential.user);
      }
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(credential);
      const isNewGoogleUser = additionalInfo?.isNewUser === true;

      await finishSignIn(
        credential.user,
        undefined,
        isNewGoogleUser,
      );
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" aria-hidden="true" />
      <div className="login-orb login-orb-two" aria-hidden="true" />

      <header className="login-header">
        <Link href="/" className="login-brand" aria-label="Whispr home">
          <span className="login-brand-icon">w.</span>
          <span>whispr</span>
        </Link>

        <Link href="/" className="login-back-link">
          Back to home <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="login-main">
        <div className="login-card">
          <div className="login-symbol" aria-hidden="true">
            <span>✳</span>
          </div>

          <p className="login-eyebrow">YOUR SPACE. YOUR RULES.</p>

          <h1 className="login-title">
            {mode === "login" ? (
              <>
                Welcome <span>back.</span>
              </>
            ) : (
              <>
                Find your <span>voice.</span>
              </>
            )}
          </h1>

          <p className="login-subtitle">
            {mode === "login"
              ? "Your little corner of the internet is waiting."
              : "Create your space and let your thoughts flow."}
          </p>

          <button
            type="button"
            className="login-google-button"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="login-divider">
            <span />
            <p>or continue with email</p>
            <span />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <div className="login-field">
                  <label htmlFor="display-name">Your name</label>
                  <input
                    id="display-name"
                    type="text"
                    autoComplete="name"
                    placeholder="What should we call you?"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={60}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="login-field">
                  <label htmlFor="requested-username">
                    Choose a username
                  </label>
                  <input
                    id="requested-username"
                    type="text"
                    autoComplete="username"
                    placeholder="e.g. gyanam_29"
                    value={requestedUsername}
                    onChange={(event) =>
                      setRequestedUsername(
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "")
                          .slice(0, 20),
                      )
                    }
                    minLength={3}
                    maxLength={20}
                    pattern="[a-z0-9_]{3,20}"
                    required
                    disabled={loading}
                  />
                  <small>Your public link will use this username.</small>
                </div>
              </>
            )}

            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="login-show-password"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="login-switch">
            {mode === "login"
              ? "New around here?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode((current) =>
                  current === "login" ? "signup" : "login",
                );
                setError("");
              }}
              disabled={loading}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p className="login-terms">
            By continuing, you agree to use Whispr responsibly and respect
            everyone&apos;s privacy.
          </p>
        </div>

        <p className="login-footer">
          A little mystery, a lot of thoughts. <span>✳</span>
        </p>
      </section>
    </main>
  );
}
