# Notification System - User Quota Alerts

## Overview

Users receive **proactive email notifications** when approaching their monthly quota limits, giving them time to upgrade before being blocked.

---

## Notification Tiers

### Professional Plan (100 chats/month)

| Usage | Trigger | Action | Email Sent |
|-------|---------|--------|------------|
| 75 chats | 75% | Info | ℹ️ "Time to consider upgrading?" |
| 80 chats | 80% | Warning | ⚠️ "80 chats remaining" |
| 90 chats | 90% | Alert | ⚠️ "10 chats remaining" |
| 95 chats | 95% | Critical | 🚨 "URGENT: Only 5 chats left!" |
| 100 chats | 100% | Blocked | ❌ Chat blocked, payment modal |

### CA Plan (250 chats/month)

| Usage | Trigger | Action | Email Sent |
|-------|---------|--------|------------|
| 188 chats | 75% | Info | ℹ️ "62 chats remaining" |
| 213 chats | 85% | Warning | ⚠️ "37 chats remaining" |
| 238 chats | 95% | Critical | 🚨 "URGENT: Only 12 chats left!" |
| 250 chats | 100% | Blocked | ❌ Chat blocked, payment modal |

---

## Email Templates

### 1. Info Email (75% Usage)

```
Subject: ℹ️ Friendly reminder: Time to consider upgrading?

Content:
Heads up: X chats left this month

You've used 75% of your quota.
If you're finding the app useful, consider upgrading to a higher plan.
```

### 2. Warning Email (80-90% Usage)

```
Subject: ⚠️ WARNING: Approaching usage limit

Content:
Warning: X chats remaining

You've used YY% of your monthly quota.
Upgrade your plan to get more chats and ensure uninterrupted access.
```

### 3. Critical Email (95%+ Usage)

```
Subject: ⚠️ URGENT: You're about to lose access

Content:
Critical: Only X chats left!

You've used YY% of your quota.
Once you reach [limit] chats, you'll be blocked from using the service.
Upgrade immediately to continue accessing the income tax analyzer!
```

---

## How It Works

### Flow Diagram

```
User sends chat 96 (Professional)
    ↓
API increments currentUsage → 96
    ↓
calculateAndNotifyUser() called
    ↓
Check: 96 >= softLimit(95)?
    ├─ YES: Check if already notified
    │        └─ If not: Send email + log
    └─ NO: Skip
    ↓
Response sent to user with warning header
    ↓
Chat interface shows warning banner
```

### Email Triggering

```
// Notification thresholds
Professional: [80, 90, 95]  // Notify at 80%, 90%, 95%
CA: [75, 85, 95]           // Notify at 75%, 85%, 95%

// Email sent only once per threshold
User reaches 80% → Email sent → lastNotificationPercentage = 80
User reaches 85% → No email (already at 80%)
User reaches 90% → Email sent → lastNotificationPercentage = 90
User reaches 95% → Email sent → lastNotificationPercentage = 95
```

---

## Database Schema

### notifications Collection

```typescript
{
  userId: "user123",
  type: "quota-warning",
  percentageUsed: 95,
  chatsRemaining: 5,
  sentAt: Timestamp,
  email: "user@example.com"
}
```

### users Collection (Enhanced)

```typescript
{
  email: "user@example.com",
  planId: "professional",
  currentUsage: 96,
  currentMonth: 202606,
  lastNotificationPercentage: 90,    // Track what % we last notified at
  notificationsEnabled: true,        // User can disable notifications
  ...
}
```

---

## User Settings Page

**Access:** `/settings`

### What Users Can Do

1. **Toggle Notifications On/Off**
   - Enable: Receive all quota warnings
   - Disable: No emails sent
   - Default: Enabled

2. **View Notification History**
   - See past quota warnings
   - Check when notifications were sent
   - Date & time stamps

3. **Manage Account**
   - View email address
   - See account creation date
   - User ID

---

## Environment Variables Required

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com              # Email service (e.g., Gmail, SendGrid)
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password       # Use app-specific password
EMAIL_FROM=noreply@bigreddyfintaxpro.com

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Gmail Setup (Free Option)

```
1. Enable 2-Factor Authentication
2. Create App Password (16-char password)
3. Use that password in EMAIL_PASSWORD
4. Use gmail-specific SMTP settings
```

### SendGrid Setup (Paid)

```
1. Create SendGrid account
2. Get API key
3. Create SMTP user from API key
4. Use SMTP credentials in .env
```

---

## API Endpoints

### GET /api/notifications

Get user's notification preferences and history.

**Request:**
```bash
GET /api/notifications
Authorization: Bearer {token}
```

**Response:**
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
  "count": 3
}
```

### POST /api/notifications

Enable/disable notifications.

**Request:**
```bash
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "disable"  // or "enable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications disabled"
}
```

---

## Testing Notifications

### Test Email Without Hitting Limit

```
1. Go to Firebase Console → Firestore
2. Edit user document
3. Set currentUsage = 80 (Professional)
4. Send a chat (will trigger 80% notification)
5. Check email inbox
```

### Test Different Thresholds

```
Manual Testing:
├─ Set currentUsage = 80 → Chat 81 → Email sent (80%)
├─ Set currentUsage = 90 → Chat 91 → Email sent (90%)
└─ Set currentUsage = 95 → Chat 96 → Email sent (95%)
```

### Check Notification History

```
1. User goes to /settings
2. Sees "Recent Notifications" section
3. Shows all past quota alerts
4. Dates/times of when emails were sent
```

---

## User Experience

### Timeline

```
Day 1 of Month:
- User starts with 100% quota available
- No notifications

Day 15:
- User has 80 chats used (80%)
- Email arrives: "⚠️ WARNING: Approaching usage limit"
- User clicks upgrade → Goes to billing

Day 20:
- User hasn't upgraded
- Now at 90 chats (90%)
- Email arrives: "⚠️ WARNING: Only 10 chats left"
- User sees payment modal

Day 25:
- Still hasn't upgraded
- At 95 chats (95%)
- Email arrives: "🚨 URGENT: You're about to lose access"

Day 26:
- User hits 100 chats
- ❌ BLOCKED from further access
- Forced to upgrade or wait until next month
```

### User Actions

**Option 1: Proactive Upgrade**
```
Email notification → Click link → Pay → Instant access
```

**Option 2: Reactive Upgrade (At Block)**
```
Hit limit → Payment modal → Pay → Instant access
```

**Option 3: Wait for Reset**
```
Hit limit → Wait until 1st of next month → Quota resets
(Not ideal for user experience!)
```

---

## Disabling Notifications

### Why Users Might Disable

- Too many emails
- Already know about quota management
- Prefer in-app warnings only

### Still Protected

- Users can still see warning banner in chat
- Hard limit still enforced
- Payment modal still required
- Just no email notifications

---

## Monitoring Notifications

### Admin Can See

In `/admin/analytics`:
- How many users disabled notifications
- Which users are at-risk
- Notification send history

---

## Cost Optimization

### Email Service Pricing

| Service | Cost | Best For |
|---------|------|----------|
| Gmail + SMTP | Free | Development, small scale |
| SendGrid | $0.10/email | Production, reliability |
| AWS SES | $0.10/1000 | High volume |
| Mailgun | Free tier | Small to medium |

### Estimated Notifications

```
100 total users:
- 30% never reach threshold = 0 emails
- 40% reach 75% = 40 emails
- 20% reach 85% = 20 emails
- 10% reach 95% = 10 emails

Total per month: ~70 emails
Cost per month: $0.70 (very cheap)
```

---

## Troubleshooting

### Email Not Sending

**Check:**
1. Environment variables set correctly
2. Email service credentials valid
3. SMTP port (587 vs 465)
4. Firewall/network blocking SMTP

**Debug:**
```typescript
// Add logging in lib/notifications.ts
console.log('Sending to:', userEmail);
console.log('SMTP config:', emailConfig.host, emailConfig.port);
```

### User Never Receives Email

**Check:**
1. notificationsEnabled = true in Firestore
2. User email is valid
3. Email in spam folder
4. Correct percentage threshold

### Too Many Emails

**Solution:**
```
Increase notification thresholds:
NOTIFICATION_THRESHOLDS = {
  professional: [90, 95],  // Removed 80
  ca: [85, 95],           // Removed 75
}
```

---

## Future Enhancements

### SMS Notifications

```typescript
// Send SMS when hitting 95%
await sendSMSNotification(userPhone, `Only 5 chats left! Upgrade now.`);
```

### Push Notifications

```typescript
// Send browser push notification
await sendPushNotification(userId, {
  title: "URGENT: Quota nearly full",
  body: "Only 5 chats remaining",
  icon: "warning.png"
});
```

### Slack Integration

```typescript
// Notify in Slack workspace
await notifySlack(userId, `User ${email} at 95% quota`);
```

---

## Summary

| Feature | Status | Location |
|---------|--------|----------|
| Email notifications | ✅ | lib/notifications.ts |
| Threshold tracking | ✅ | lib/usage.ts |
| User preferences | ✅ | app/settings/page.tsx |
| API endpoints | ✅ | app/api/notifications/route.ts |
| Notification history | ✅ | Settings page |
| Admin monitoring | ✅ | Admin analytics |

**Users are now proactively notified before hitting limits!** 🎉
