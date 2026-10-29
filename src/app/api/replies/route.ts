import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/admin";
import { requireUser, safeText } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  messageId: z.string().min(10).max(150),
  reply: z.string().min(1).max(500),
  published: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request.
    const user = await requireUser(req);

    // Validate the request body.
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message ID, reply, or publication status." },
        { status: 400 }
      );
    }

    const { messageId, published } = parsed.data;
    const reply = safeText(parsed.data.reply, 500);

    if (!reply.trim()) {
      return NextResponse.json(
        { error: "Reply cannot be empty." },
        { status: 400 }
      );
    }

    const db = adminDb();
    const messageRef = db.collection("messages").doc(messageId);
    const publicReplyRef = db.collection("publicReplies").doc(messageId);

    const messageSnapshot = await messageRef.get();

    if (!messageSnapshot.exists) {
      return NextResponse.json(
        { error: "Message not found. Refresh your inbox and try again." },
        { status: 404 }
      );
    }

    const message = messageSnapshot.data();

    // Only the recipient may reply to this message.
    if (message?.recipientUid !== user.uid) {
      return NextResponse.json(
        { error: "You are not authorized to reply to this message." },
        { status: 403 }
      );
    }

    const profileSnapshot = await db
      .collection("profiles")
      .doc(user.uid)
      .get();

    const profile = profileSnapshot.data();

    // Commit both changes together so they cannot partially succeed.
    const batch = db.batch();

    batch.update(messageRef, {
      reply,
      published,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (published) {
      batch.set(publicReplyRef, {
        messageId,
        recipientUid: user.uid,
        username: profile?.username || "",
        displayName: profile?.displayName || "",
        message: message?.text || "",
        reply,
        published: true,
        createdAt: message?.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      batch.delete(publicReplyRef);
    }

    await batch.commit();

    console.info("Whispr reply saved", {
      messageId,
      recipientUid: user.uid,
      published,
    });

    return NextResponse.json({ ok: true, messageId, published });
  } catch (error) {
    console.error("Whispr reply API failed:", error);

    return NextResponse.json(
      { error: "Unable to save your reply. Check the server terminal logs." },
      { status: 500 }
    );
  }
}
