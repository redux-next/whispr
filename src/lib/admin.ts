
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  const existing = getApps().find((app) => app.name === "[DEFAULT]");
  if (existing) return existing;

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let serviceAccount: Record<string, unknown>;

  try {
    if (encoded?.trim()) {
      serviceAccount = JSON.parse(
        Buffer.from(encoded.trim(), "base64").toString("utf8")
      );
    } else if (raw?.trim()) {
      serviceAccount = JSON.parse(raw);
    } else {
      throw new Error(
        "Add FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_JSON to .env.local"
      );
    }
  } catch (error) {
    throw new Error(
      `Firebase service-account credentials are invalid: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  const privateKey = serviceAccount.private_key;

  if (typeof privateKey !== "string" || !privateKey.includes("PRIVATE KEY")) {
    throw new Error(
      "The Firebase service-account private key is missing or invalid. Download a real service-account JSON file from Firebase Console."
    );
  }

  serviceAccount.private_key = privateKey.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert(
      serviceAccount as Parameters<typeof cert>[0]
    ),
  });
}

export function adminDb() {
  return getFirestore(adminApp());
}

export function adminAuth() {
  return getAuth(adminApp());
}
