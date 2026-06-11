# 🚀 Complete Deployment Guide

Deploy the entire income tax analyzer system with authentication, payments, usage tracking, and notifications.

---

## ✅ Pre-Deployment Checklist

### Infrastructure
- [ ] Firebase project created
- [ ] Razorpay account set up
- [ ] Email service configured (Gmail or SendGrid)
- [ ] Domain/hosting ready
- [ ] Git repository initialized

### Files Ready
- [ ] All code files created
- [ ] Environment variables documented
- [ ] Firestore rules prepared
- [ ] Database schema planned

---

## 📋 Step-by-Step Deployment

### **Phase 1: Firebase Setup (15 minutes)**

#### Step 1.1: Create Firebase Project
```
1. Go to console.firebase.google.com
2. Click "Create Project"
3. Name: "Income Tax Analyzer"
4. Enable Google Analytics (optional)
5. Create project
```

#### Step 1.2: Get Firebase Credentials
```
1. Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. Extract credentials:
   - projectId
   - clientEmail
   - privateKey
```

#### Step 1.3: Enable Authentication
```
1. Firebase Console → Authentication
2. Enable Email/Password sign-in
3. Email link sign-in: Optional
4. Copy Web API Key for client
```

#### Step 1.4: Create Firestore Database
```
1. Firestore Database → Create Database
2. Start in production mode
3. Location: Choose closest to users
4. Click "Enable"
```

#### Step 1.5: Deploy Firestore Rules
```bash
# Copy firestore.rules content
# Firebase Console → Firestore → Rules
# Paste the rules and publish
```

---

### **Phase 2: Google Pay Setup (10 minutes)**

#### Step 2.1: Get Google Merchant ID
```
1. Go to https://pay.google.com/gp/pay/merchant-setup
2. Sign in with Google account
3. Click "Get Started" → Create merchant account
4. Enter business information
5. Complete verification (2-5 business days for production)
6. Note your Merchant ID
7. For now, use test ID: 12345678901234567890
```

#### Step 2.2: Get UPI ID (Optional)
```
1. Contact your bank (HDFC, Axis, ICICI, etc.)
2. Request merchant UPI ID
3. Example: merchant@okhdfcbank
4. Save for later (can use without this)
```

#### Step 2.3: Review Google Pay Documentation
```
1. Read: GOOGLEPAY_SETUP.md (in project)
2. Understand: Payment flow and security
3. Note: No API keys needed (unlike Razorpay)
```

---

### **Phase 3: Email Configuration (10 minutes)**

#### Step 3.1: Gmail Setup (Free Option)
```
1. Go to myaccount.google.com
2. Security → 2-Step Verification (enable)
3. Security → App Passwords
4. Select Mail, Windows Computer
5. Copy 16-character password
6. Keep for environment variables
```

#### Step 3.2: SendGrid Setup (Paid Option)
```
1. Go to sendgrid.com
2. Create account
3. Get API key from Settings
4. Use "apikey" as username
5. Use API key as password
```

---

### **Phase 4: Local Development Setup (20 minutes)**

#### Step 4.1: Install Dependencies
```bash
cd /path/to/indian-income-tax-analyser
npm install
```

#### Step 4.2: Create .env.local
```bash
# Copy this template and fill in your values

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_CLIENT_EMAIL=your_admin_email@iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your_key_here

# Google Pay
NEXT_PUBLIC_GOOGLEPAY_MERCHANT_ID=12345678901234567890
NEXT_PUBLIC_UPI_ID=merchant@bankcode
NEXT_PUBLIC_UPI_NAME=Your Business Name

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Step 4.3: Verify Firebase Connection
```bash
npm run dev
# Visit http://localhost:3000
# Should not have Firebase errors in console
```

---

### **Phase 5: Local Testing (30 minutes)**

#### Test 5.1: Authentication
```
1. Go to http://localhost:3000
2. Should redirect to /auth/login
3. Click "Sign up here"
4. Create account: test@example.com / Password123
5. Should redirect to chat
```

#### Test 5.2: Free Trial (3 chats)
```
1. Send 3 chats normally
2. Chat 4 should show payment modal
3. Click "Upgrade to Professional"
4. Should show pricing plans
```

#### Test 5.3: Google Pay Payment
```
1. Click upgrade button
2. Should show PaymentModal with Google Pay button
3. Click "Pay with Google Pay"
4. Google Pay sheet should open
5. Select test payment method
6. Complete payment
7. Should upgrade plan successfully
```

#### Test 5.5: Usage Tracking
```
1. Upgrade to Professional
2. Go to /usage
3. Should show 0 chats used
4. Send 3 chats
5. Go to /usage
6. Should show 3 chats used
7. Click refresh
8. Should update in real-time
```

#### Test 5.6: Quota Limits
```
1. In Firestore, set currentUsage = 100
2. Try to send chat
3. Should show 429 error
4. Payment modal should appear
5. Can't proceed without upgrading
```

#### Test 5.7: Notifications
```
1. Set currentUsage = 95
2. Send a chat
3. Check email inbox
4. Should receive warning email
5. Check /settings
6. Should see notification in history
7. Can toggle notifications on/off
```

#### Test 5.8: Admin Dashboard
```
1. Make yourself admin (Firebase Console)
2. Log out and back in
3. Go to /admin/analytics
4. Should see all metrics
5. Can switch tabs (Summary/Users/At-Risk)
```

---

### **Phase 6: Deployment Preparation (30 minutes)**

#### Step 6.1: Production Environment Variables
```bash
# Create new .env.production.local with:
# - Production Razorpay keys (live, not test)
# - Production Firebase project
# - Production email account
# - Production app URL
```

#### Step 6.2: Google Pay Production Setup
```
1. Get production Merchant ID (verify account first, 2-5 days)
2. Get production UPI ID from your bank
3. Add to .env.production.local:
   - NEXT_PUBLIC_GOOGLEPAY_MERCHANT_ID=your_merchant_id
   - NEXT_PUBLIC_UPI_ID=your_upi_id
4. No additional webhook setup needed
```

#### Step 6.4: Verify Database Rules
```
Firebase Console → Firestore → Rules

Should allow:
✓ Users can read own profile
✓ Users can create profile on signup
✗ Users cannot update/delete directly
✓ Admin can read all data
✓ Server can write to collections
```

---

### **Phase 7: Build & Deploy (30 minutes)**

#### Step 7.1: Build Locally
```bash
npm run build
# Should complete without errors
# Check for any warnings
```

#### Step 7.2: Test Production Build
```bash
npm run start
# Visit http://localhost:3000
# Test all features once more
```

#### Step 7.3: Deploy (Choose One)

**Option A: Vercel (Recommended)**
```bash
npm install -g vercel
vercel deploy
# Follow prompts
# Enter production domain when asked
# Copy environment variables from .env.production.local
```

**Option B: Firebase Hosting**
```bash
firebase deploy
# Deploys functions and hosting
# Ensure .firebaserc is configured
```

**Option C: Your Own Server**
```bash
# Build: npm run build
# Copy to server: /var/www/app
# Start with PM2: pm2 start npm -- start
```

#### Step 7.4: Verify Deployment
```bash
# Visit https://yourdomain.com
# Test signup/login
# Test payment (Razorpay test mode works in prod too)
# Check /admin/analytics loads
```

---

### **Phase 8: Post-Deployment (20 minutes)**

#### Step 8.1: Set First Admin User
```
1. User signs up on production
2. Firebase Console → Users → Click user
3. Custom Claims: {"admin": true}
4. User logs out and logs back in
5. Can now access /admin/analytics
```

#### Step 8.2: Enable Email Notifications
```
1. Production email should be live
2. Test by setting currentUsage = 95
3. Send chat
4. Check for email in inbox
5. May take 30 seconds
```

#### Step 8.3: Verify Google Pay Production
```
1. Check Merchant ID matches production
2. Try payment with test card (still works in production)
3. Verify payment appears in Firestore
4. Check amount is correct (₹299 or ₹999)
5. Ensure database updated properly
```

#### Step 8.4: Monitor Analytics
```
1. Go to /admin/analytics
2. Should show real users signing up
3. Monitor revenue as users upgrade
4. Check for any errors in logs
```

#### Step 8.5: Send Welcome Email
```
1. Create email template
2. Send to all early users
3. Explain 3 free chats
4. Link to /billing
5. Drive early conversions
```

---

### **Phase 9: Production Checklist (15 minutes)**

#### Security
- [ ] Firestore rules in production mode
- [ ] No test API keys in production
- [ ] HTTPS enabled on domain
- [ ] Firebase security rules deployed
- [ ] Email service credentials secure

#### Monitoring
- [ ] Admin dashboard accessible
- [ ] Error logging set up (Firebase/Sentry)
- [ ] Email sends working
- [ ] Payment processing working
- [ ] Quota enforcement working

#### User Experience
- [ ] Signup/login working
- [ ] Free trial 3 chats limit works
- [ ] Payment modal shows
- [ ] Notifications send
- [ ] Usage analytics visible

#### Finance
- [ ] Razorpay webhook configured
- [ ] Bank account linked for settlement
- [ ] Profit margin > 35%
- [ ] First test payment successful

---

### **Phase 10: Launch & Growth (Ongoing)**

#### Launch Week
```
Day 1: Soft launch to 10 beta users
Day 2: Monitor errors, fix bugs
Day 3: Expand to 50 users
Day 4: Expand to 200 users
Day 5: Public launch
```

#### Optimization
```
Monitor:
- Signup conversion rate
- Free trial → Paid upgrade rate
- Payment success rate
- Average revenue per user

Adjust:
- Pricing if needed
- Notification timing
- Usage limits
- Feature availability
```

---

## 🧪 Quick Testing Checklist

```
BEFORE LAUNCH:
[ ] User signup works
[ ] User login works
[ ] 3 free chats enforced
[ ] Payment modal shows at limit
[ ] Razorpay payment works
[ ] UPI QR code generates
[ ] Usage tracking works
[ ] Quota limits enforced
[ ] Email notifications send
[ ] Admin dashboard loads
[ ] Settings page works
[ ] All error messages display
```

---

## 🆘 Troubleshooting

### Firebase Connection Error
```
Fix: Check FIREBASE_PRIVATE_KEY format
Should have actual newlines, not \n strings
```

### Razorpay Payment Fails
```
Fix: Verify API keys match mode (test vs live)
Check webhook URL is correct
```

### Emails Not Sending
```
Fix: Verify EMAIL_PASSWORD is app-specific (not account password)
Check SMTP port (587 for TLS)
```

### Admin Dashboard Blank
```
Fix: Set custom claim in Firebase Console
Log out and log back in
Check browser console for errors
```

---

## 📞 After Launch Support

### Daily
- [ ] Check admin dashboard for new users
- [ ] Monitor error logs
- [ ] Verify payments processing

### Weekly
- [ ] Calculate revenue & profit
- [ ] Check churn rate
- [ ] Review at-risk users
- [ ] Send upgrade emails to near-limit users

### Monthly
- [ ] Full analytics review
- [ ] Adjust pricing if needed
- [ ] Plan feature improvements
- [ ] Review user feedback

---

## 🎯 Success Metrics

```
Good Signs:
✓ Users signing up daily
✓ Upgrade rate > 20%
✓ Payment success rate > 95%
✓ Notification emails opening
✓ Profit margin > 35%
✓ User satisfaction high

Areas to Improve:
✗ Low signup rate → Improve marketing
✗ Low upgrade rate → Improve notifications
✗ Payment failures → Check Razorpay setup
✗ No emails → Check email config
✗ Low profit → Increase prices
```

---

## 📚 Documentation Ready

All documentation is prepared:
- ✅ SETUP_GUIDE.md - Detailed setup
- ✅ FEATURE_SUMMARY.md - Feature overview
- ✅ USAGE_CAPS_AND_MONITORING.md - Quota system
- ✅ NOTIFICATION_SYSTEM.md - Notifications
- ✅ NOTIFICATIONS_SETUP.md - Email setup
- ✅ IMPLEMENTATION_COMPLETE.md - What's built

---

## 🚀 Summary

| Phase | Time | Status |
|-------|------|--------|
| **Firebase Setup** | 15 min | 📋 Checklist ready |
| **Razorpay Setup** | 10 min | 📋 Checklist ready |
| **Email Setup** | 10 min | 📋 Checklist ready |
| **Local Testing** | 20 min | 📋 Checklist ready |
| **Dev Environment** | 20 min | 📋 Checklist ready |
| **Production Build** | 30 min | 📋 Checklist ready |
| **Deployment** | 30 min | 📋 Checklist ready |
| **Post-Launch** | 20 min | 📋 Checklist ready |

**Total Time:** ~2.5 hours to full production deployment 🎉

---

## ✨ You're Ready!

All code is built, all documentation is ready, and you have a complete deployment guide. 

**Next steps:**
1. Follow this guide step-by-step
2. Test each phase thoroughly
3. Launch with confidence
4. Monitor analytics
5. Optimize based on data

**Everything is production-ready!** 🚀
