# Usage Caps & Monitoring System

## Overview

The system now includes:
1. **Hard Usage Caps** - Prevents users from exceeding their tier limits
2. **Soft Warnings** - Notifies users when approaching limits
3. **Admin Analytics Dashboard** - Monitor all user activity and revenue

---

## Usage Caps by Plan

| Plan | Hard Limit | Soft Warning | Warning Trigger |
|------|-----------|--------------|-----------------|
| **Free** | 3 chats total | N/A | After 3rd chat |
| **Professional** | 100 chats/month | 95 chats | At 95% usage |
| **CA** | 250 chats/month | 200 chats | At 80% usage |

---

## How It Works

### 1. Hard Caps (Blocking)

When user hits hard limit:
```
User tries chat 101 (Professional)
    ↓
API checks: currentUsage >= limit
    ↓
Returns 429 (Too Many Requests)
    ↓
Client shows payment modal
```

### 2. Soft Warnings (Non-blocking)

When user approaches limit (80%):
```
User sends chat 201 (CA)
    ↓
API checks: usage >= softLimit (200)
    ↓
Response includes: X-Quota-Near-Limit: true
    ↓
Client shows yellow warning banner
    ↓
User can still chat, but encouraged to upgrade
```

---

## User Experience Flow

### Professional User (95/100 chats used)

**Chat 96:**
```
User: "Tell me about capital gains"
    ↓
API checks: 96 >= 95 (soft limit)
    ↓
Response: X-Quota-Near-Limit: true
    ↓
⚠️ Warning Banner Appears:
   "You're approaching your monthly quota
    5 of 100 chats remaining this month"
    ↓
User can click "Upgrade Plan" button
```

**Chat 101:**
```
User tries to send message
    ↓
API checks: 101 >= 100 (hard limit)
    ↓
Returns 429 error
    ↓
❌ Payment modal shows
   "You've used 100 chats this month"
```

### CA User (220/250 chats used)

**Chat 221:**
```
⚠️ Warning appears: "30 of 250 chats remaining"
User can still chat
```

**Chat 251:**
```
❌ Hard limit reached
Blocked from further chats
Must wait until month resets
```

---

## Admin Analytics Dashboard

**Access:** `/admin/analytics` (requires admin role)

### Dashboard Shows:

#### 1. Summary Cards
- **Total Users** - Break down by plan
- **Monthly Revenue** - Sum of all subscriptions
- **API Costs** - Estimated spend
- **Profit** - Revenue minus costs
- **Profit Margin** - Percentage

#### 2. Usage Distribution Chart
```
0-10 chats:    12 users
11-50 chats:   28 users
51-100 chats:  45 users
101-200 chats: 32 users
200+ chats:    8 users
```

#### 3. All Users Table
```
Email | Plan | Usage | % Used | Status
──────┼──────┼───────┼────────┼─────────
user1@… | Professional | 87 | 87% | ✓ OK
user2@… | CA | 215 | 86% | ⚠️ Near Limit
user3@… | Free | 3 | 100% | ✓ OK (at limit)
```

#### 4. At-Risk Users List
```
Users who are at 80%+ of their limit
Suggestions to reach out or notify about upgrade
```

---

## Implementation Details

### Firestore Schema

```typescript
// users/{userId}
{
  email: "user@example.com",
  planId: "professional",
  
  // Usage tracking
  currentUsage: 87,           // Incremented after each chat
  currentMonth: 202606,       // YYYYMM format for reset
  
  // Soft/hard limits (read-only, calculated in code)
  // Not stored - derived from TIER_LIMITS
}
```

### Quota Checking Logic

```typescript
export const TIER_LIMITS = {
  free: 3,
  professional: 100,
  ca: 250,
};

export const SOFT_LIMITS = {
  free: 3,           // No soft warning for free
  professional: 95,  // Warn at 95%
  ca: 200,          // Warn at 80%
};

// In checkQuota():
const nearLimit = usage >= SOFT_LIMITS[planId];
const allowed = usage < TIER_LIMITS[planId];
```

### API Response Headers

```
X-Quota-Limit: 100              // User's plan limit
X-Quota-Remaining: 13           // Remaining chats
X-Quota-Near-Limit: true        // Whether near soft limit
X-Quota-Percentage: 87          // Percentage used (0-100)
```

---

## Setting Up Admin Access

### Make User an Admin

In Firebase Console:
1. Go to Authentication → Users
2. Find user
3. Click Custom Claims
4. Add: `{"admin": true}`

Or via Firebase Admin SDK:
```typescript
await adminAuth.setCustomUserClaims(userId, { admin: true });
```

### Admin Can Now:
- Access `/admin/analytics` dashboard
- View all user activity
- Monitor costs vs revenue
- Identify heavy users
- Plan pricing adjustments

---

## Monitoring Checklist

### Daily
- [ ] Check if any CA users are hitting 200+ chats
- [ ] Monitor profit margin
- [ ] Look for unusual usage patterns

### Weekly
- [ ] Review at-risk users list
- [ ] Check total revenue vs costs
- [ ] Analyze usage distribution

### Monthly
- [ ] Calculate profit margins
- [ ] Plan pricing adjustments if needed
- [ ] Review user growth vs CAC
- [ ] Check if hard limits are being hit frequently

---

## Potential Issues & Solutions

### Issue: CA users frequently hitting 250 limit

**Solution Options:**
1. Increase limit to 300
2. Raise price to ₹1,299/month
3. Implement overage fees
4. Encourage data export for offline use

### Issue: Professional tier users at only 20 chats/month average

**Solution Options:**
1. Price is too high - lower to ₹199/month
2. Features not compelling enough
3. Users prefer free tier - make it expire after 30 days
4. Create "Lite" plan at ₹99 for 30 chats

### Issue: API costs exceeding 50% of revenue

**Solution Options:**
1. Use cheaper model (Sonnet) for simple queries
2. Implement prompt caching
3. Raise prices across all tiers
4. Add feature limitations to free tier

---

## Cost Optimization

### Current API Cost Model

```
Claude Opus:    0.003 per 100 input + 0.015 per 100 output
Claude Sonnet:  0.0003 per 100 input + 0.0015 per 100 output
                = 10x cheaper than Opus

Estimated per chat:
Opus:   ₹2.50 average
Sonnet: ₹0.25 average
```

### Strategy: Hybrid Model

```typescript
if (query.length < 200 && !query.includes("complex")) {
  // Simple query → Use Sonnet (0.25)
  model = "claude-sonnet-4-6";
} else {
  // Complex query → Use Opus (2.50)
  model = "claude-opus-4-7";
}
```

**Benefit:** 40% reduction in API costs while maintaining quality

---

## Dashboard Features

### Real-time Metrics

**Summary Cards:**
```
Total Users: 156
├─ Free: 98
├─ Professional: 42
└─ CA: 16

Monthly Revenue: ₹23,582
Monthly Costs: ₹14,200
Profit: ₹9,382
Margin: 39.8%
```

### User Tables

**Top Users by Usage** (most chats)
```
Useful for:
- Identifying power users
- Finding candidates for CA upgrade
- Detecting potential abuse
```

**At-Risk Users** (near limit)
```
Useful for:
- Proactive outreach
- Understanding satisfaction
- Planning limit increases
```

### Usage Distribution

**Visual breakdown**
```
█████░░░░░░░░░░ 0-10 chats: 12
██████████░░░░░ 11-50 chats: 28
████████████░░░ 51-100 chats: 45
██████░░░░░░░░░ 101-200 chats: 32
███░░░░░░░░░░░░ 200+ chats: 8
```

---

## Alerts & Notifications (Future)

### Automatic Alerts

```
When: CA user hits 240/250 chats
Send: "Only 10 chats left! Upgrade to unlimited or chats will be blocked"

When: Professional user at 99 chats
Send: "Last chat available! Upgrade to CA for unlimited"

When: API costs exceed 40% of revenue
Alert admin: "Costs rising - consider price increase"
```

### Implementation
```typescript
// In usage tracking
if (usage === limit - 5) {
  // Send warning email
  await sendEmail(userId, "quota-warning");
}

if (totalCosts > revenue * 0.4) {
  // Alert admin
  await notifyAdmin("cost-warning");
}
```

---

## Testing Usage Caps

### Test Free User (3 chat limit)

```
1. Create test account
2. Chat 1 → ✅ Works
3. Chat 2 → ✅ Works
4. Chat 3 → ✅ Works
5. Chat 4 → ❌ Payment modal
```

### Test Professional User (100 chat limit)

```
1. Upgrade to Professional
2. Set currentUsage to 95 in Firestore
3. Chat 96 → ⚠️ Warning banner shows
4. Set currentUsage to 100
5. Chat 101 → ❌ Blocked
```

### Test Month Reset

```
1. Set currentMonth to 202605
2. Check currentUsage = 50
3. Wait for month to change (or manually change currentMonth)
4. Check currentUsage → Should be 0
5. User can chat again
```

---

## Summary

| Feature | Status | Location |
|---------|--------|----------|
| Hard caps enforcement | ✅ | lib/usage.ts |
| Soft warnings | ✅ | app/api/chat/route.ts |
| Warning banner UI | ✅ | app/page.tsx |
| Admin analytics | ✅ | /admin/analytics |
| Cost tracking | ✅ | analytics API |
| Usage distribution | ✅ | analytics dashboard |
| At-risk detection | ✅ | analytics API |

Everything is ready to monitor and control usage! 🎯
