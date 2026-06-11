# Google Pay Integration (Alternative to Razorpay)

Google Pay is simpler and better for Indian users. Here's how to set it up:

## Option 1: Google Pay via Razorpay (Recommended)
Razorpay has built-in Google Pay support. Just use Razorpay as is - Google Pay will appear as a payment option automatically.

## Option 2: Direct Google Pay Integration

If you prefer direct Google Pay integration without Razorpay:

### Setup Steps:

1. **Register with Google Pay**
   - Visit https://pay.google.com/business/
   - Create a merchant account
   - Get your Merchant ID

2. **Add to Environment Variables**
```bash
GOOGLE_PAY_MERCHANT_ID=your_merchant_id
GOOGLE_PAY_MERCHANT_NAME=Indian Income Tax Analyser
GOOGLE_PAY_GATEWAY=googlepay  # For test, use 'googlepay'
GOOGLE_PAY_GATEWAY_MERCHANT_ID=your_razorpay_merchant_id  # If using with Razorpay
```

3. **Pricing in Google Pay Format**
```
Free: ₹0
Professional: ₹299/month
CA: ₹999/month
```

### Implementation Notes:

- Google Pay shows native UPI apps (PhonePe, PayTM, Google Pay, WhatsApp Pay)
- Users get multiple payment options on their device
- Requires HTTPS (not for localhost testing)
- Settlement directly to your bank account

### Which to Choose?

| Feature | Razorpay | Google Pay Direct |
|---------|----------|------------------|
| Setup Time | 10 min | 20 min |
| Settlement | 1-2 days | 1-2 days |
| Webhook Support | ✓ | Limited |
| Native UPI | ✓ (via Razorpay) | ✓ |
| Subscription Support | ✓ | ❌ |
| Refunds | Easy | Easy |
| Cost | Lower % | Slightly higher |

**Recommendation:** Use Razorpay with Google Pay enabled. You get both:
- Direct Google Pay option
- Razorpay's subscription & webhook management
- Lower fees
