# Authentication & Billing Setup Guide

## What's Been Implemented

### 1. **Mandatory Email Authentication**
- Replaced anonymous Firebase auth with required email/password signup
- Users must create an account to access the app
- Authentication pages: `/auth/signup`, `/auth/login`, `/auth/reset-password`

### 2. **Server-Side Usage Tracking**
- Every API call logged to Firestore `usage_logs` collection
- Monthly quota tracking per user
- Automatic monthly quota reset

### 3. **Per-Tier Request Limits**
- **Free**: 3 requests/month
- **Professional**: 100 requests/month  
- **CA (Chartered Accountant)**: 10,000 requests/month (unlimited)

### 4. **Razorpay Payment Integration**
- One-time payments for plan upgrades
- Payment verification with signature validation
- Webhook support for subscription management
- Automatic user profile updates on successful payment

### 5. **Billing & Subscription Dashboard**
- View current plan and usage stats
- Upgrade/downgrade plans
- See upcoming billing dates
- Usage progress bar

---

## Environment Variables to Set

Add these to your `.env.local` file:

```bash
# Firebase (already configured, keep as is)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDmdQuuBJpCpihUqc2YGO7AbV84uyWvMk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bigreddyfintaxpro.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bigreddyfintaxpro
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bigreddyfintaxpro.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=947277482577
NEXT_PUBLIC_FIREBASE_APP_ID=1:947277482577:web:7cb08d6f9df7ae28f30670

# Firebase Admin (server-side)
FIREBASE_CLIENT_EMAIL=your-firebase-admin-email@bigreddyfintaxpro.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Razorpay Keys (Get from https://dashboard.razorpay.com/app/keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Razorpay Webhook Secret (Set after creating webhook in dashboard)
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx

# UPI QR Code Payment (Optional - for QR code scanning)
NEXT_PUBLIC_UPI_ID=your_merchant_upi@bankcode
NEXT_PUBLIC_UPI_NAME=BigReddy FinTaxPro
```

---

## Razorpay Setup Steps

1. **Get API Keys**
   - Log in to Razorpay Dashboard
   - Go to Settings → API Keys
   - Copy Key ID and Key Secret
   - Add to `.env.local`

2. **Configure Webhook** (for production)
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
   - Subscribe to events:
     - `subscription.activated`
     - `subscription.failed`
     - `subscription.halted`
     - `subscription.cancelled`
     - `invoice.paid`
   - Copy webhook secret and add to `.env.local`

3. **Test in Development**
   - Use Razorpay test mode API keys
   - Test credit card: `4111 1111 1111 1111`
   - Any expiry date, any CVV

---

## Database Schema Updates

The Firestore database now has:

### `users/{userId}`
```typescript
{
  email: string;
  planId: "free" | "professional" | "ca";
  monthlyQuota: number;
  currentUsage: number;
  currentMonth: number; // YYYYMM format
  createdAt: Timestamp;
  isAnonymous: false;
  lastPaymentId?: string;
  lastPaymentDate?: Timestamp;
  subscriptionStatus?: "active" | "failed" | "halted" | "cancelled";
  razorpaySubscriptionId?: string;
  subscriptionEndDate?: Timestamp;
}
```

### `usage_logs/{logId}`
```typescript
{
  userId: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: Timestamp;
  month: number; // YYYYMM format
}
```

### `payments/{paymentId}`
```typescript
{
  userId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  planId: string;
  status: "success" | "failed";
  timestamp: Timestamp;
}
```

---

## UPI QR Code Payment Setup (Optional)

### What is it?
Users can scan a QR code with their phone to pay via UPI. Works with:
- PhonePe, PayTM, Google Pay, WhatsApp Pay, BHIM, any UPI app

### Setup:
1. Get your merchant UPI ID from your bank (format: `merchant@bankcode`)
2. Add to `.env.local`:
```bash
NEXT_PUBLIC_UPI_ID=your_merchant_upi@bankcode
NEXT_PUBLIC_UPI_NAME=BigReddy FinTaxPro
```
3. Install dependencies: `npm install qrcode jsqr`

### How users pay:
1. Select "📱 UPI QR Code" on billing page
2. QR code appears
3. Open UPI app → Scan QR
4. Approve payment on phone
5. Click "Payment Done"
6. Plan upgraded instantly

### Features:
- ✅ Works with all UPI apps
- ✅ No app redirection needed
- ✅ Instant plan upgrade
- ✅ Optional (Razorpay is fallback)

See `UPI_QR_SETUP.md` for detailed setup and testing.

---

## Testing Checklist

- [ ] User can sign up with new email
- [ ] User can log in with correct credentials
- [ ] Login fails with wrong password
- [ ] User is redirected to login when accessing `/` without auth
- [ ] Free user gets 3 requests/month
- [ ] After 3 requests, free user gets 429 error
- [ ] User can upgrade to Professional plan via Razorpay (test mode)
- [ ] Professional user gets 100 requests/month
- [ ] Monthly quota resets on the 1st of next month
- [ ] Usage stats are displayed correctly in billing page
- [ ] Logout works and redirects to login

---

## API Endpoints

### Authentication
- `GET /api/chat` - Requires auth token
- Returns 429 if quota exceeded

### Usage Tracking
- `GET /api/usage/stats` - Get current month's usage stats (requires auth)

### Razorpay
- `POST /api/razorpay/create-order` - Create payment order (requires auth)
- `POST /api/razorpay/verify-payment` - Verify payment signature (requires auth)
- `POST /api/razorpay/webhook` - Razorpay webhook handler (no auth)

---

## Incognito Mode Protection

Since all auth is server-side:
- Each user has a unique Firebase UID
- Usage is tied to Firestore user document by UID
- Incognito mode users cannot bypass quota (they get different UID)
- Monthly quota is enforced server-side, not client-side

---

## Next Steps

1. Set up Razorpay account
2. Add environment variables to `.env.local`
3. Run `npm install` to install razorpay package
4. Test signup/login flow
5. Test payment in Razorpay test mode
6. Deploy and configure webhook
