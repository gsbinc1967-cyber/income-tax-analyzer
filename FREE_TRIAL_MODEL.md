# Free Trial Model - 3 Free Chats

## How It Works

Every new user gets **3 completely free chats** to try out the Indian Income Tax Analyser before paying.

### User Journey

1. **User signs up** → Creates account with email
2. **Automatic:** Profile created with `totalFreeChatsUsed: 0`
3. **User starts chatting** → Chat 1, 2, 3 work normally
4. **After 3 chats** → Payment modal appears
5. **Options:**
   - Upgrade to Professional (₹299/month, 100 chats/month)
   - Upgrade to CA Plan (₹999/month, unlimited chats)
   - Use UPI QR code or Razorpay

---

## Pricing Tiers

| Plan | Price | Chats per Month | Best For |
|------|-------|-----------------|----------|
| **Free Trial** | ₹0 | 3 total (lifetime) | Try before buying |
| **Professional** | ₹299 | 100 | Working professionals |
| **CA (Chartered Accountant)** | ₹999 | Unlimited | Tax professionals |

---

## Technical Implementation

### Free Trial Tracking

```typescript
// Users collection stores:
{
  email: "user@example.com",
  planId: "free",
  totalFreeChatsUsed: 0,  // Increments after each chat
  monthlyQuota: 3,         // Max free chats
  createdAt: Timestamp
}
```

### Free Chat Counting

- **After each chat:** `totalFreeChatsUsed` increments by 1
- **Checked before chat:** If `totalFreeChatsUsed >= 3`, show payment modal
- **One-time reset:** No monthly reset (3 chats total, not per month)

### Payment Modal Trigger

```javascript
if (profile.planId === "free" && profile.totalFreeChatsUsed >= 3) {
  // Show payment modal
  setShowPaymentModal(true);
  return;
}
```

---

## User Flows

### Flow 1: New Free User (Chats 1-3)
```
Sign Up
  ↓
Chat 1 ✅ (totalFreeChatsUsed: 0 → 1)
  ↓
Chat 2 ✅ (totalFreeChatsUsed: 1 → 2)
  ↓
Chat 3 ✅ (totalFreeChatsUsed: 2 → 3)
  ↓
Try Chat 4 ❌ (totalFreeChatsUsed: 3)
  ↓
Payment Modal → "You've used 3 free chats"
  ↓
Choose Plan → Upgrade to Professional/CA
```

### Flow 2: Free User Upgrades
```
After Chat 3 → Payment Modal
  ↓
User clicks "Upgrade to Professional"
  ↓
Select payment method (Razorpay or UPI QR)
  ↓
Payment successful
  ↓
Profile updated: planId = "professional"
  ↓
Monthly quota set: monthlyQuota = 100
  ↓
Current month reset: currentUsage = 0
  ↓
User can chat again ✅
```

### Flow 3: Paid User (Professional)
```
Upgrade to Professional (₹299/month)
  ↓
Get 100 chats per month
  ↓
Monthly reset on 1st of month
  ↓
Can upgrade/downgrade anytime
```

---

## Firestore Schema

### users/{userId}
```json
{
  "email": "user@example.com",
  "planId": "free" | "professional" | "ca",
  
  // Free tier tracking
  "totalFreeChatsUsed": 2,     // Counts up to 3
  "monthlyQuota": 3,            // Fixed: 3 for free
  
  // Paid tier tracking
  "currentMonth": 202606,       // YYYYMM format
  "currentUsage": 45,           // Resets monthly
  
  // Subscription info
  "lastPaymentId": "pay_123",
  "lastPaymentDate": Timestamp,
  "subscriptionStatus": "active",
  
  "createdAt": Timestamp,
  "isAnonymous": false
}
```

---

## Advantages

✅ **Simple for Users**
- Clear: 3 free chats, then pay
- No confusing monthly cycles for free tier
- Works great for impulse upgrades

✅ **Good Conversion**
- Users get hooked after 1-2 chats
- By chat 3, they want to continue
- Low friction upgrade with multiple payment methods

✅ **No Revenue Leakage**
- Each user = 3 chats max for free
- Can't reset (no monthly boundary)
- Server-side enforcement (can't bypass)

✅ **Easy Accounting**
- Clear distinction: Free tier = 3 chats
- Paid tier = monthly subscription
- No complex quota management

---

## How to Verify It's Working

### Step 1: Create Test Account
```
Sign up with: test@example.com
```

### Step 2: Use 3 Free Chats
```
Chat 1: "What is Section 10?" → Should work
Chat 2: "Explain capital gains" → Should work
Chat 3: "What is TDS?" → Should work
Chat 4: "Ask anything" → Payment modal appears ✅
```

### Step 3: Check Firestore
```
In Firebase Console → Firestore → users/{userId}
{
  email: "test@example.com",
  planId: "free",
  totalFreeChatsUsed: 3,  // Should be 3
  monthlyQuota: 3
}
```

### Step 4: Upgrade and Verify
```
Click "Upgrade to Professional" in modal
  ↓
Complete payment
  ↓
Firestore updates to:
{
  planId: "professional",
  monthlyQuota: 100,
  currentUsage: 1,  // Resets because new payment
  currentMonth: 202606
}
  ↓
User can chat again ✅
```

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| User completes chat 3 | `totalFreeChatsUsed` = 3, triggers payment modal |
| User closes payment modal | Chat input disabled, must upgrade |
| User upgrades to Professional | `planId` changes, `currentUsage` resets |
| User downgrades to Free | `planId` = "free", `totalFreeChatsUsed` stays at 3 (used) |
| User signs up but never chats | `totalFreeChatsUsed` = 0 (keeps 3 free) |
| User cancels subscription | Downgrades to free, `totalFreeChatsUsed` history preserved |

---

## Future Enhancements

### Option 1: Rolling Free Chats
Change 3 total chats to "3 chats per 30 days" (resets monthly):
```typescript
// In checkQuota():
if (userMonth !== currentMonth) {
  // Reset free chats for new month
  totalFreeChatsUsed = 0;
}
```

### Option 2: Referral Bonus
Add 3 bonus chats per referral:
```typescript
totalFreeChatsUsed += (numReferrals * 3);
```

### Option 3: Premium Free Trial
Offer 7-day free trial of Professional plan:
```typescript
{
  planId: "free",
  freeTrialEndDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
  hadFreeTrialOfPaid: false
}
```

---

## Summary

| Feature | Details |
|---------|---------|
| **Free Tier** | 3 chats total (lifetime) |
| **Trigger Payment** | After 3rd chat is sent |
| **Payment Methods** | Razorpay + UPI QR Code |
| **Paid Tiers** | Professional (100/mo), CA (unlimited) |
| **Reset Policy** | No reset for free (one-time 3 chats) |
| **Bypass Prevention** | Server-side enforcement, unique Firebase UID per signup |
