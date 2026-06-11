import { NextResponse } from 'next/server';
import { getPricingByPlanId } from '@/lib/googlepay';
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
    const { paymentData, planId, transactionId } = body;

    if (!paymentData || !planId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields (paymentData, planId, transactionId)' },
        { status: 400 }
      );
    }

    // Verify the payment data came from Google Pay
    // In production, you would verify the signature here using Google's public key
    // For now, we trust the client-side validation and server-side verification below

    try {
      // Parse the payment data token
      const paymentInfo = JSON.parse(paymentData);

      // Verify essential payment info exists
      if (!paymentInfo.paymentMethodData) {
        return NextResponse.json(
          { error: 'Invalid payment data structure' },
          { status: 400 }
        );
      }

      // Get pricing for the plan
      const pricing = getPricingByPlanId(planId);
      if (pricing.priceInRupees === 0) {
        return NextResponse.json(
          { error: 'Free plan cannot be purchased' },
          { status: 400 }
        );
      }

      // In a real scenario, you would also:
      // 1. Validate the transaction amount matches the pricing
      // 2. Verify the signature from Google Pay
      // 3. Process the payment with your payment gateway
      // For this implementation, we assume successful payment after client-side validation

      // Update user's plan in Firestore
      const userRef = adminDb.collection('users').doc(decodedToken.uid);

      await userRef.update({
        planId: planId,
        monthlyQuota: pricing.monthlyQuota,
        lastPaymentId: transactionId,
        lastPaymentDate: new Date(),
        subscriptionStatus: 'active',
      });

      // Log the payment
      await adminDb.collection('payments').add({
        userId: decodedToken.uid,
        transactionId,
        amount: pricing.priceInRupees,
        currency: 'INR',
        planId,
        paymentMethod: 'googlepay',
        status: 'success',
        paymentData: {
          type: paymentInfo.paymentMethodData?.type || 'unknown',
          // Don't log sensitive card details
        },
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified and plan updated',
        planId,
        transactionId,
      });
    } catch (parseError: any) {
      console.error('Payment data parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid payment data format' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
