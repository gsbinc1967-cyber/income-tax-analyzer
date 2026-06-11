# Notification System Setup Guide

## ✅ Complete Notification System Implemented

Users now receive **proactive email notifications** when approaching usage limits, giving them time to upgrade before being blocked.

---

## 📬 What Users Receive

### Notification Sequence

```
75% Usage
    ↓
💌 Email: "Time to consider upgrading?"
    ↓
80% Usage
    ↓
📧 Email: "⚠️ WARNING: Only XX chats left"
    ↓
95% Usage
    ↓
🚨 Email: "🚨 URGENT: Only X chats left!"
    ↓
100% Usage
    ↓
❌ BLOCKED + Payment Modal
```

### Professional Plan (100 chats)
- 75 chats → Email 1
- 80 chats → Email 2
- 90 chats → Email 3
- 95 chats → Email 4

### CA Plan (250 chats)
- 188 chats (75%) → Email 1
- 213 chats (85%) → Email 2
- 238 chats (95%) → Email 3

---

## 🔧 Setup Instructions

### Step 1: Add Email Configuration

Add to `.env.local`:

**Option A: Gmail (Free)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@bigreddyfintaxpro.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Option B: SendGrid (Paid, Reliable)**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@bigreddyfintaxpro.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 2: Gmail Setup (If Using Gmail)

1. **Enable 2-Factor Authentication:**
   - Go to myaccount.google.com
   - Security → 2-Step Verification

2. **Create App Password:**
   - Security → App Passwords
   - Select "Mail" and "Windows Computer"
   - Google generates 16-char password
   - Copy this to `EMAIL_PASSWORD`

### Step 3: Install Dependencies

```bash
npm install nodemailer
```

### Step 4: Update Firestore Rules

Ensure notifications collection is allowed:
```
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
              request.auth.uid == resource.data.userId;
  allow write: if false; // Server-only writes
}
```

---

## 🎯 How It Works

### Automatic Notification Process

```
User sends chat
    ↓
API increments currentUsage
    ↓
checkAndNotifyUser() called automatically
    ↓
Is usage >= threshold? (80, 90, 95, etc)
    ├─ YES: Check if already notified
    │        ├─ No: Send email + log
    │        └─ Yes: Skip
    └─ NO: Continue
    ↓
Response sent with quota headers
    ↓
Client shows warning banner
```

### One Email Per Threshold

```
Professional at 80% → Email sent → lastNotificationPercentage = 80
Professional at 85% → No email (already at 80%)
Professional at 90% → Email sent → lastNotificationPercentage = 90
Professional at 95% → Email sent → lastNotificationPercentage = 95
```

---

## 👤 User Settings Page

**Access:** `/settings`

### Features:

1. **Toggle Notifications**
   - Enable/disable all quota emails
   - Changes instant
   - Default: Enabled

2. **View Notification History**
   - See past quota warnings
   - When emails were sent
   - Percentage used at send time

3. **Account Info**
   - Email address
   - User ID
   - Account creation date

---

## 📊 Admin Dashboard

**Access:** `/admin/analytics`

### Monitoring:

- How many users disabled notifications
- Which users are at-risk
- Notification send frequency
- Email engagement

---

## 📈 Email Templates

### Template 1: Info (75% usage)
```
Subject: ℹ️ Friendly reminder: Time to consider upgrading?

Heads up: XX chats left this month

You've used 75% of your quota.
If you're finding the app useful, consider upgrading to a higher plan.

[View Billing & Upgrade] button
```

### Template 2: Warning (80-90% usage)
```
Subject: ⚠️ WARNING: Approaching usage limit

Warning: XX chats remaining

You've used YY% of your monthly quota.
Upgrade your plan to get more chats and ensure uninterrupted access.

[View Billing & Upgrade] button
```

### Template 3: Critical (95%+ usage)
```
Subject: ⚠️ URGENT: You're about to lose access

Critical: Only X chats left!

You've used YY% of your quota.
Once you reach [limit] chats, you'll be blocked from using the service.
Upgrade immediately to continue accessing the income tax analyzer!

[View Billing & Upgrade] button
```

---

## 🧪 Testing Notifications

### Test 1: Trigger 80% Notification

```
1. Go to Firebase Console → Firestore
2. Find a Professional user document
3. Set currentUsage = 80
4. User sends a chat
5. Check email inbox → Should receive "⚠️ WARNING" email
```

### Test 2: Multiple Thresholds

```
1. Set currentUsage = 80 → User sends chat → Email (80%)
2. Set currentUsage = 90 → User sends chat → Email (90%)
3. Set currentUsage = 95 → User sends chat → Email (95%)
```

### Test 3: User Settings

```
1. Go to /settings
2. See "Recent Notifications" section
3. Should list all 3 emails sent
4. Click "Disable" button
5. Send another chat → No email sent
6. Click "Enable" button → Resume notifications
```

---

## 📋 API Endpoints

### GET /api/notifications
Get user's notification preferences & history

```bash
curl -H "Authorization: Bearer {token}" \
  https://yourdomain.com/api/notifications
```

Response:
```json
{
  "notificationsEnabled": true,
  "notifications": [
    {
      "type": "quota-warning",
      "percentageUsed": 95,
      "chatsRemaining": 5,
      "sentAt": "2026-06-11T10:30:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/notifications
Enable/disable notifications

```bash
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"action": "disable"}' \
  https://yourdomain.com/api/notifications
```

Response:
```json
{
  "success": true,
  "message": "Notifications disabled"
}
```

---

## 🔒 Privacy & Compliance

### What's Tracked

```
✓ Email address (for sending notifications)
✓ Notification preferences (enabled/disabled)
✓ Notification history (when sent)
✗ NOT email open status
✗ NOT click tracking
```

### GDPR Compliance

- Users can disable all notifications
- Can request deletion of notification history
- Email addresses only used for this purpose
- No third-party email tracking

---

## 💰 Cost

### Typical Monthly Cost

```
100 users:
- ~70 notifications sent per month
- Gmail: Free (if you have Gmail account)
- SendGrid: $0.70/month
- AWS SES: $0.007/month (but needs setup)
```

### Zero Cost Option

Use your own email/Gmail:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-company-gmail@gmail.com
EMAIL_PASSWORD=app-password

Result: All notifications free! 🎉
```

---

## 🚀 Deployment Checklist

- [ ] Add email environment variables
- [ ] Install `npm install nodemailer`
- [ ] Test Gmail/SendGrid connection locally
- [ ] Update Firestore rules for notifications
- [ ] Deploy to production
- [ ] Test notification email receipt
- [ ] Test settings page (`/settings`)
- [ ] Verify admin can see at-risk users
- [ ] Monitor notification send logs

---

## 📊 Monitoring

### Key Metrics

```
✓ Notification send rate (per day)
✓ Email bounce rate
✓ Users with notifications disabled
✓ Most common notification level
✓ Time to upgrade after notification
```

### Check Email Logs

In Firestore → `notifications` collection:
```
Each entry shows:
- Who received it
- What percentage triggered it
- When it was sent
- Email address
```

---

## ❓ Troubleshooting

### Email Not Sending

**Check:**
1. `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD` set
2. Gmail: Use app-specific password (not account password)
3. SendGrid: API key correct
4. SMTP port (587 for TLS, 465 for SSL)

**Test:**
```
Set currentUsage = 80 in Firestore
Send a chat
Check Firebase logs for errors
```

### User Not Receiving Email

**Check:**
1. `notificationsEnabled = true` in Firestore
2. Email address is valid
3. Check spam folder
4. Recent chat triggered notification (usage >= threshold)

### Too Many Emails

**Solution:**
Change thresholds in `lib/notifications.ts`:
```typescript
export const NOTIFICATION_THRESHOLDS = {
  professional: [90, 95],  // Reduce from [80, 90, 95]
  ca: [95],               // Reduce from [75, 85, 95]
};
```

---

## 🎯 Summary

| Feature | Status | Triggers |
|---------|--------|----------|
| Email notifications | ✅ | 80%, 90%, 95% for Pro; 75%, 85%, 95% for CA |
| User preferences | ✅ | /settings page |
| Notification history | ✅ | /settings page |
| Admin monitoring | ✅ | /admin/analytics |
| Warning banner | ✅ | In-chat (non-blocking) |
| Hard block | ✅ | At 100% (blocking) |

---

## 📚 Files Added

```
✅ lib/notifications.ts              - Core notification logic
✅ app/api/notifications/route.ts    - Notification API
✅ app/settings/page.tsx             - User settings page
✅ NOTIFICATION_SYSTEM.md            - Detailed documentation
✅ NOTIFICATIONS_SETUP.md            - This file
```

---

## 🎉 Result

Users now get **proactive notifications** before hitting limits:

```
Chat 75/100 → Email: "Consider upgrading"
Chat 80/100 → Email: "Warning - 20 left"
Chat 90/100 → Email: "Warning - 10 left"
Chat 95/100 → Email: "URGENT - 5 left!"
Chat 100/100 → ❌ BLOCKED
```

This dramatically increases **voluntary upgrades** before forced blocking!

---

## Next Steps

1. **Configure email service** (Gmail or SendGrid)
2. **Add env variables** to `.env.local`
3. **Run `npm install nodemailer`**
4. **Test locally** (send a notification)
5. **Deploy to production**
6. **Monitor** notification sends

**Everything is ready to deploy!** 🚀
