import { NextResponse } from 'next/server';
import { razorpay, getPricingByPlanId } from '@/lib/razorpay';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    const pricing = getPricingByPlanId(planId);
    if (pricing.priceInPaise === 0) {
      return NextResponse.json({ error: 'Free plan cannot be purchased' }, { status: 400 });
    }

    // Get user email for receipt
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: pricing.priceInPaise,
      currency: 'INR',
      receipt: `order_${decodedToken.uid}_${Date.now()}`,
      notes: {
        userId: decodedToken.uid,
        planId: planId,
        userEmail: userRecord.email || 'unknown',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: planId,
      planName: pricing.name,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
