
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/admin";
import { requireUser } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, {
      message:
        "Username must be 3–20 characters using letters, numbers, or underscores.",
    }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { username } = schema.parse(await req.json());
    const db = adminDb();

    const profileRef = db.collection("profiles").doc(user.uid);

    await db.runTransaction(async (tx) => {
      const profileSnap = await tx.get(profileRef);

      if (!profileSnap.exists) {
        throw new Error("PROFILE_NOT_FOUND");
      }

      const profile = profileSnap.data()!;
      const oldUsername =
        typeof profile.username === "string"
          ? profile.username.toLowerCase()
          : "";

      const newUsernameRef = db.collection("usernames").doc(username);
      const newUsernameSnap = await tx.get(newUsernameRef);

      if (
        newUsernameSnap.exists &&
        newUsernameSnap.data()?.uid !== user.uid
      ) {
        throw new Error("USERNAME_TAKEN");
      }

      if (oldUsername && oldUsername !== username) {
        const oldUsernameRef = db
          .collection("usernames")
          .doc(oldUsername);

        const oldUsernameSnap = await tx.get(oldUsernameRef);

        if (
          oldUsernameSnap.exists &&
          oldUsernameSnap.data()?.uid === user.uid
        ) {
          tx.delete(oldUsernameRef);
        }
      }

      tx.set(
        newUsernameRef,
        {
          uid: user.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      tx.update(profileRef, {
        username,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true, username });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid username." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to update username.";

    if (message === "USERNAME_TAKEN") {
      return NextResponse.json(
        { error: "That username is already taken. Try another." },
        { status: 409 },
      );
    }

    if (message === "PROFILE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Your profile was not found." },
        { status: 404 },
      );
    }

    if (message === "Sign in to continue.") {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    console.error("Username update failed:", error);

    return NextResponse.json(
      { error: "Unable to update username right now." },
      { status: 500 },
    );
  }
}
