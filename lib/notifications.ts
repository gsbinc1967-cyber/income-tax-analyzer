import { adminDb, adminAuth } from './firebase-admin';
import nodemailer from 'nodemailer';

// Email configuration (update with your email service)
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(emailConfig);

/**
 * Notification thresholds for each plan
 */
export const NOTIFICATION_THRESHOLDS = {
  professional: [80, 90, 95], // Notify at 80%, 90%, 95%
  ca: [75, 85, 95],           // Notify at 75%, 85%, 95%
};

/**
 * Send email notification to user about quota
 */
export async function sendQuotaNotificationEmail(
  userId: string,
  userEmail: string,
  planId: string,
  currentUsage: number,
  limit: number,
  percentageUsed: number
): Promise<void> {
  try {
    const percentageRemaining = 100 - percentageUsed;
    const chatsRemaining = limit - currentUsage;

    let subject = '';
    let message = '';

    if (percentageUsed >= 95) {
      subject = '⚠️ URGENT: You\'re about to lose access';
      message = `
        <h2 style="color: #f44336;">Critical: Only ${chatsRemaining} chats left!</h2>
        <p>You've used <strong>${percentageUsed}%</strong> of your monthly quota.</p>
        <p>Once you reach ${limit} chats, you'll be blocked from using the service.</p>
        <p style="color: #f44336; font-weight: bold;">
          Upgrade immediately to continue accessing the income tax analyzer!
        </p>
      `;
    } else if (percentageUsed >= 85) {
      subject = '⚠️ WARNING: Approaching usage limit';
      message = `
        <h2 style="color: #ff9800;">Warning: ${chatsRemaining} chats remaining</h2>
        <p>You've used <strong>${percentageUsed}%</strong> of your monthly quota.</p>
        <p>Upgrade your plan to get more chats and ensure uninterrupted access.</p>
      `;
    } else if (percentageUsed >= 75) {
      subject = 'ℹ️ Friendly reminder: Time to consider upgrading?';
      message = `
        <h2 style="color: #2196f3;">Heads up: ${chatsRemaining} chats left this month</h2>
        <p>You've used <strong>${percentageUsed}%</strong> of your quota.</p>
        <p>If you're finding the app useful, consider upgrading to a higher plan.</p>
      `;
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #0a0e27; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
          .stats { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2196f3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Indian Income Tax Analyser</h1>
          </div>

          <div class="content">
            ${message}

            <div class="stats">
              <p><strong>Your Current Usage:</strong></p>
              <ul style="list-style: none; padding: 0;">
                <li>✓ Chats Used: <strong>${currentUsage} of ${limit}</strong></li>
                <li>✓ Remaining: <strong>${chatsRemaining}</strong></li>
                <li>✓ Percentage: <strong>${percentageUsed}%</strong></li>
              </ul>
            </div>

            <p>Your plan: <strong>${planId === 'professional' ? 'Professional (₹299/month)' : 'CA (₹999/month)'}</strong></p>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="button">
                View Billing & Upgrade
              </a>
            </div>

            <p style="font-size: 13px; color: #666; margin-top: 20px;">
              <strong>What happens when you reach your limit?</strong>
              Once you use all ${limit} chats, you'll be unable to access the analyzer until you:
              <ul>
                <li>Upgrade your plan (get immediate access + more chats)</li>
                <li>Wait until next month (usage resets on 1st)</li>
              </ul>
            </p>
          </div>

          <div class="footer">
            <p>© 2026 BigReddy FinTaxPro. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #2196f3; text-decoration: none;">
                Manage notification preferences
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@bigreddyfintaxpro.com',
      to: userEmail,
      subject: subject,
      html: htmlBody,
    });

    // Log notification sent
    await adminDb.collection('notifications').add({
      userId,
      type: 'quota-warning',
      percentageUsed,
      chatsRemaining,
      sentAt: new Date(),
      email: userEmail,
    });

    console.log(`Quota notification sent to ${userEmail} (${percentageUsed}%)`);
  } catch (error) {
    console.error('Error sending quota notification:', error);
    // Don't throw - we don't want to fail the API call if email fails
  }
}

/**
 * Check if we should send notification and send it
 */
export async function checkAndNotifyUser(
  userId: string,
  planId: string,
  currentUsage: number,
  limit: number
): Promise<void> {
  try {
    const percentageUsed = Math.round((currentUsage / limit) * 100);
    const thresholds = NOTIFICATION_THRESHOLDS[planId as keyof typeof NOTIFICATION_THRESHOLDS];

    if (!thresholds) return; // No thresholds for this plan

    // Check if we should notify at this percentage
    if (!thresholds.includes(percentageUsed)) return;

    // Check if we already sent notification at this percentage
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const lastNotificationPercentage = userData?.lastNotificationPercentage || 0;

    // Only send if we haven't already notified at this level
    if (lastNotificationPercentage >= percentageUsed) return;

    // Get user email
    const userEmail = userData?.email;
    if (!userEmail) return;

    // Send notification
    await sendQuotaNotificationEmail(userId, userEmail, planId, currentUsage, limit, percentageUsed);

    // Update last notification percentage
    await userRef.update({
      lastNotificationPercentage: percentageUsed,
    });
  } catch (error) {
    console.error('Error checking and notifying user:', error);
  }
}

/**
 * Get all sent notifications for a user
 */
export async function getUserNotifications(userId: string): Promise<any[]> {
  try {
    const snapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('sentAt', 'desc')
      .limit(10)
      .get();

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Disable notifications for user
 */
export async function disableNotificationsForUser(userId: string): Promise<void> {
  try {
    await adminDb.collection('users').doc(userId).update({
      notificationsEnabled: false,
    });
  } catch (error) {
    console.error('Error disabling notifications:', error);
  }
}

/**
 * Enable notifications for user
 */
export async function enableNotificationsForUser(userId: string): Promise<void> {
  try {
    await adminDb.collection('users').doc(userId).update({
      notificationsEnabled: true,
    });
  } catch (error) {
    console.error('Error enabling notifications:', error);
  }
}
