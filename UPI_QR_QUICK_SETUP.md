# ⚡ UPI QR Code - Quick Setup (5 Minutes)

**Get UPI QR code payments working in 5 minutes.**

---

## TL;DR

1. Get UPI ID from your bank
2. Add to `.env.local`
3. Done! QR codes work

---

## Step 1: Get Your UPI ID (2 minutes)

### If You Already Have Business UPI

Skip to Step 2 and use your existing UPI ID.

### If You Don't Have Business UPI

**Fastest way:**
1. Open your bank's app (HDFC, Axis, ICICI, etc.)
2. Go to: Settings → Business/Merchant → UPI
3. Request Business UPI ID
4. Get something like: `bigreddyincome@okhdfcbank`

**Takes:** 5 minutes to a few hours (depending on bank)

---

## Step 2: Add to Environment (1 minute)

**File:** `.env.local`

```bash
NEXT_PUBLIC_UPI_ID=your_upi_id_here
NEXT_PUBLIC_UPI_NAME=Your Business Name
```

**Example:**
```bash
NEXT_PUBLIC_UPI_ID=bigreddyincome@okhdfcbank
NEXT_PUBLIC_UPI_NAME=BigReddy Income Tax Pro
```

---

## Step 3: Test (2 minutes)

```bash
1. npm run dev
2. Go to http://localhost:3000/billing
3. Click "Upgrade"
4. Click "Generate QR Code"
5. QR code appears
6. Scan with Google Pay/PhonePe to test
```

---

## Step 4: Deploy (Optional)

When ready for production:

```bash
1. Update .env.production.local with same UPI ID
2. npm run build
3. Deploy
4. Done!
```

---

## That's It! 🎉

Your customers can now:
- Click "Upgrade"
- Choose "Generate QR Code"
- Scan with any UPI app
- Pay directly to your UPI account

Money appears in your bank account instantly! 💰

---

## Verification

After customer pays:

**Check 1: Your Bank Account**
```
Open your bank app
Look for recent transaction
Amount: ₹299 or ₹999
Status: Should show "Completed"
```

**Check 2: Admin Dashboard**
```
Go to /admin/analytics
Look for Recent Payments
Should show user who paid
Amount should match
Status: Verified
```

**Check 3: Customer's App**
```
App shows plan upgraded
Quota updated to new limit
Can use new chats
```

---

## Troubleshooting

### QR Code Doesn't Generate
**Problem:** QR code button doesn't work

**Fix:**
1. Check .env.local has NEXT_PUBLIC_UPI_ID
2. Check format: username@bankcode
3. Restart dev server
4. Clear browser cache

### QR Code Shows But Won't Scan
**Problem:** Can't scan the QR code

**Fix:**
1. Ensure good lighting
2. Try different angle
3. Make sure phone is not zoomed in
4. Use alternative: Manual entry (shown below QR)

### Payment Received But Plan Didn't Upgrade
**Problem:** Money in bank but user's plan still shows "Free"

**Fix:**
1. User needs to refresh page
2. Or manually upgrade in Firestore
3. Monitor more closely - track transaction ID

---

## What Happens When User Pays

### Step by Step

```
User generates QR code
    ↓
Opens Google Pay / PhonePe / UPI app
    ↓
Taps "Scan"
    ↓
Points at QR code
    ↓
App shows: Pay ₹299 to BigReddy Income Tax Pro
    ↓
User taps "Confirm"
    ↓
User enters PIN
    ↓
Payment sent!
    ↓
User sees "Success" in their app
    ↓
User clicks "Payment Done" in your app
    ↓
Plan upgrades immediately
    ↓
Money appears in your bank account
```

---

## Money Flow

```
Customer's Bank → UPI Network → Your UPI ID → Your Bank Account
                     ↓
               (1-3 rupees fee deducted)
```

**Timeline:**
- Payment: Instant (2-5 seconds)
- Settlement: Same day (usually 1 hour)
- Bank notification: Real-time

---

## Multiple Payment Methods Now Available

Your app now has:

### Method 1: Google Pay Button
```
Click "Pay Now with Google Pay"
↓
Google Pay opens
↓
User selects payment method
↓
Complete
```

### Method 2: QR Code
```
Click "Generate QR Code"
↓
QR appears
↓
User scans with UPI app
↓
Complete
```

**Both go to your UPI account!**

---

## Environment Variables Reference

```bash
# Required
NEXT_PUBLIC_UPI_ID=merchant@bankcode

# Recommended
NEXT_PUBLIC_UPI_NAME=Your Business Name

# Optional
NEXT_PUBLIC_GOOGLEPAY_MERCHANT_ID=...
```

---

## Files Added/Modified

### New Files
- `lib/upi-qr.ts` - QR code generation logic
- `components/UPIQRPayment.tsx` - QR display component
- `UPI_QR_RECEIVER.md` - Complete documentation
- `UPI_QR_QUICK_SETUP.md` - This file

### Modified Files
- `components/PaymentModal.tsx` - Added QR code option

### Installed Packages
- `qrcode` - For QR code generation

---

## Next Steps

1. ✅ Get UPI ID (5 min)
2. ✅ Add to .env (1 min)
3. ✅ Test locally (2 min)
4. ✅ Deploy to production (5 min)
5. ✅ Monitor first payments (ongoing)

**Total: ~15 minutes for full setup!**

---

## Support

See **UPI_QR_RECEIVER.md** for complete guide.

See **GOOGLEPAY_SETUP.md** for overall setup.

---

**You're ready to receive UPI QR payments!** 🚀

Start with: Get UPI ID → Add to .env → Done!
