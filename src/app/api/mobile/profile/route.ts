import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import { requireUser, safeText } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const snap = await adminDb().collection('profiles').doc(user.uid).get();
    if (!snap.exists) return NextResponse.json({ error: 'Profile not found. Sign up through the Whispr website or complete profile setup.' }, { status: 404 });
    const data = snap.data()!;
    return NextResponse.json({ profile: { username: data.username || '', displayName: data.displayName || user.name || '', bio: data.bio || '', inboxEnabled: data.inboxEnabled === true } });
  } catch (error) {
    console.error('mobile profile read error', error);
    return NextResponse.json({ error: 'Unable to load profile. Please sign in again.' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const schema = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/), displayName: z.string().trim().min(3).max(40) });
    const body = schema.parse(await req.json());
    const db = adminDb();
    const profileRef = db.collection('profiles').doc(user.uid);
    const usernameRef = db.collection('usernames').doc(body.username);
    await db.runTransaction(async (tx) => {
      const [profileSnap, usernameSnap] = await Promise.all([tx.get(profileRef), tx.get(usernameRef)]);
      if (profileSnap.exists) throw new Error('Profile already exists.');
      if (usernameSnap.exists) throw new Error('That username is taken. Choose another.');
      const displayName = safeText(body.displayName, 40);
      tx.set(usernameRef, { uid: user.uid, username: body.username });
      tx.set(profileRef, { uid: user.uid, username: body.username, displayName, bio: '', inboxEnabled: true, createdAt: new Date(), updatedAt: new Date() });
    });
    return NextResponse.json({ ok: true, profile: { username: body.username, displayName: body.displayName, bio: '', inboxEnabled: true } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create profile.';
    const status = message.includes('taken') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
