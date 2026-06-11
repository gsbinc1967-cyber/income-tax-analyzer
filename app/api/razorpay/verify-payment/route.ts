import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { razorpay, getPricingByPlanId } from '@/lib/razorpay';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature
    const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(signatureBody)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay to confirm
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (payment.status !== 'captured') {
      return NextResponse.json(
        { error: 'Payment not captured' },
        { status: 400 }
      );
    }

    // Update user's plan in Firestore
    const pricing = getPricingByPlanId(planId);
    const userRef = adminDb.collection('users').doc(decodedToken.uid);

    await userRef.update({
      planId: planId,
      monthlyQuota: pricing.monthlyQuota,
      lastPaymentId: razorpayPaymentId,
      lastPaymentDate: new Date(),
      subscriptionStatus: 'active',
    });

    // Log the payment
    await adminDb.collection('payments').add({
      userId: decodedToken.uid,
      razorpayPaymentId,
      razorpayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      planId,
      status: 'success',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and plan updated',
      planId,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
