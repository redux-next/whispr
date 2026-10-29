import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import { requireUser } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const snapshot = await adminDb()
      .collection('messages')
      .where('recipientUid', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text || '',
        tag: data.tag || 'message',
        reply: data.reply || '',
        published: data.published === true,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
      };
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('mobile inbox error', error);
    return NextResponse.json({ error: 'Unable to load inbox. Please sign in again.' }, { status: 401 });
  }
}
