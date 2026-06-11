import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getUsageStats } from '@/lib/usage';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const stats = await getUsageStats(decodedToken.uid);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Usage stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
