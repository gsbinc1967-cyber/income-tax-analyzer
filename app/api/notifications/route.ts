import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getUserNotifications, disableNotificationsForUser, enableNotificationsForUser } from '@/lib/notifications';

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

    // Get user's notifications
    const notifications = await getUserNotifications(decodedToken.uid);

    // Get user's notification preferences
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const notificationsEnabled = userDoc.data()?.notificationsEnabled !== false;

    return NextResponse.json({
      notificationsEnabled,
      notifications,
      count: notifications.length,
    });
  } catch (error: any) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const { action } = body;

    if (action === 'disable') {
      await disableNotificationsForUser(decodedToken.uid);
      return NextResponse.json({ success: true, message: 'Notifications disabled' });
    } else if (action === 'enable') {
      await enableNotificationsForUser(decodedToken.uid);
      return NextResponse.json({ success: true, message: 'Notifications enabled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Notification preference error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
