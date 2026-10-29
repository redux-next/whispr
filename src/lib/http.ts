import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/admin";
export function jsonError(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
export async function requireUser(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) throw new Error("Sign in to continue.");
  const decoded = await adminAuth().verifyIdToken(match[1]);
  return decoded;
}
export function clientKey(req: NextRequest) {
  // IP is used only as a rate-limit key; do not store raw IPs in message documents.
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  return ip.slice(0, 80) || "unknown";
}
export async function consumeLimit(key: string, max: number, windowMs: number) {
  const db = adminDb(); const ref = db.collection("rateLimits").doc(key);
  const now = Date.now();
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref); const data = snap.data();
    if (data && data.expiresAt > now && data.count >= max) return false;
    const sameWindow = data && data.expiresAt > now;
    tx.set(ref, { count: sameWindow ? data.count + 1 : 1, expiresAt: sameWindow ? data.expiresAt : now + windowMs });
    return true;
  });
}
export function safeText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}
