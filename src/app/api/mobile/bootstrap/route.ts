import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/admin';
import { requireUser, safeText } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/), displayName: z.string().trim().min(3).max(40) }).parse(await req.json());
    const db = adminDb();
    const profileRef = db.collection('profiles').doc(user.uid);
    const usernameRef = db.collection('usernames').doc(body.username);
    await db.runTransaction(async (tx) => {
      const [profileSnap, usernameSnap] = await Promise.all([tx.get(profileRef), tx.get(usernameRef)]);
      if (profileSnap.exists) throw new Error('This account already has a Whispr profile.');
      if (usernameSnap.exists) throw new Error('That username is taken. Choose another.');
      const displayName = safeText(body.displayName, 40);
      tx.set(usernameRef, { uid: user.uid, username: body.username });
      tx.set(profileRef, { uid: user.uid, username: body.username, displayName, bio: '', inboxEnabled: true, createdAt: new Date(), updatedAt: new Date() });
    });
    return NextResponse.json({ ok: true, profile: { username: body.username, displayName: body.displayName, bio: '', inboxEnabled: true } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to finish account setup.';
    return NextResponse.json({ error: message }, { status: message.includes('taken') ? 409 : 400 });
  }
}
