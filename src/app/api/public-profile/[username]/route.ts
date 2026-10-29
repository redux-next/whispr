import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, context: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await context.params;
  const username = rawUsername.toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  const db = adminDb();
  const nameSnap = await db.collection('usernames').doc(username).get();
  if (!nameSnap.exists) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  const uid = nameSnap.data()?.uid;
  const profileSnap = await db.collection('profiles').doc(uid).get();
  if (!profileSnap.exists || profileSnap.data()?.inboxEnabled !== true) return NextResponse.json({ error: 'This inbox is unavailable.' }, { status: 404 });
  const profile = profileSnap.data()!;
  return NextResponse.json({ profile: { username, displayName: profile.displayName || username, bio: profile.bio || '', inboxEnabled: true } }, { headers: { 'Cache-Control': 'no-store' } });
}
