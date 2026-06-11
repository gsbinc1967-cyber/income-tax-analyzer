import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Webhook handler for Razorpay events
 * Configure this URL in Razorpay Dashboard:
 * https://yourdomain.com/api/razorpay/webhook
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case 'subscription.failed':
        await handleSubscriptionFailed(event.payload.subscription.entity);
        break;

      case 'subscription.halted':
        await handleSubscriptionHalted(event.payload.subscription.entity);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.payload.invoice.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const userId = subscription.notes?.userId;
  if (!userId) return;

  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update({
    subscriptionStatus: 'active',
    razorpaySubscriptionId: subscription.id,
    subscriptionEndDate: new Date(subscription.expire_by * 1000),
  });
}

async function handleSubscriptionFailed(subscription: any) {
  const userId = subscription.notes?.userId;
  if (!userId) return;

  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update({
    subscriptionStatus: 'failed',
  });
}

async function handleSubscriptionHalted(subscription: any) {
  const userId = subscription.notes?.userId;
  if (!userId) return;

  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update({
    subscriptionStatus: 'halted',
  });
}

async function handleSubscriptionCancelled(subscription: any) {
  const userId = subscription.notes?.userId;
  if (!userId) return;

  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update({
    subscriptionStatus: 'cancelled',
    planId: 'free',
    monthlyQuota: 3,
  });
}

async function handleInvoicePaid(invoice: any) {
  const userId = invoice.subscription_notes?.userId;
  if (!userId) return;

  // Log payment for accounting
  await adminDb.collection('payments').add({
    userId,
    razorpayInvoiceId: invoice.id,
    amount: invoice.amount,
    currency: invoice.currency,
    status: 'paid',
    timestamp: new Date(),
  });
}
