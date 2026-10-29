import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();

    // Keep the rest of your existing code here.
    const body = await request.json();

    const username =
      typeof body.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    const message =
      typeof body.text === "string" ? body.text.trim() : "";

    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      return NextResponse.json(
        { error: "Invalid username." },
        { status: 400 }
      );
    }

    if (!message || message.length > 500) {
      return NextResponse.json(
        { error: "Question must contain 1–500 characters." },
        { status: 400 }
      );
    }

    const usernameSnapshot = await adminDb
      .collection("usernames")
      .doc(username)
      .get();

    if (!usernameSnapshot.exists) {
      return NextResponse.json(
        { error: "This Whispr profile does not exist." },
        { status: 404 }
      );
    }

    const usernameData = usernameSnapshot.data();

    // Supports the username reservation schema using either field.
    const recipientUid =
      typeof usernameData?.uid === "string"
        ? usernameData.uid
        : typeof usernameData?.userId === "string"
          ? usernameData.userId
          : "";

    if (!recipientUid) {
      console.error("Username document has no UID:", username);

      return NextResponse.json(
        { error: "This profile is not configured correctly yet." },
        { status: 500 }
      );
    }

    const messageRef = adminDb.collection("messages").doc();

    await messageRef.set({
      recipientUid,
      text: message,
      createdAt: FieldValue.serverTimestamp(),
      reply: "",
      published: false,
    });

    return NextResponse.json(
      { success: true, messageId: messageRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Whispr message API error:", error);

    return NextResponse.json(
      { error: "Unable to send your question right now." },
      { status: 500 }
    );
  }
}
