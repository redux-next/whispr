
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/admin";
import { requireUser } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  inboxEnabled: z.boolean().optional(),
  bio: z.string().trim().max(300).optional(),
  displayName: z.string().trim().max(80).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.inboxEnabled !== undefined) {
      patch.inboxEnabled = body.inboxEnabled;
    }

    if (body.bio !== undefined) {
      patch.bio = body.bio;
    }

    if (body.displayName !== undefined) {
      patch.displayName = body.displayName;
    }

    const db = adminDb();
    const profileRef = db.collection("profiles").doc(user.uid);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      return NextResponse.json(
        { error: "Your profile was not found." },
        { status: 404 },
      );
    }

    await profileRef.update(patch);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid profile data." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to update profile.";

    if (message === "Sign in to continue.") {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    console.error("Profile update failed:", error);

    return NextResponse.json(
      { error: "Unable to update profile right now." },
      { status: 500 },
    );
  }
}
