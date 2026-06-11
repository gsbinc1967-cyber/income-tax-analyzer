import { adminDb, FieldValue } from './firebase-admin';
import { checkAndNotifyUser } from './notifications';

// Tier-based monthly request limits
export const TIER_LIMITS: Record<string, number> = {
  free: 3,
  professional: 100,
  ca: 250, // CA: Hard cap at 250 chats/month (soft warning at 200)
};

// Soft warning thresholds (warn user but don't block)
export const SOFT_LIMITS: Record<string, number> = {
  free: 3,
  professional: 95, // Warn at 95%
  ca: 200, // Warn at 80% (200 out of 250)
};

// Get current month in YYYYMM format
function getCurrentMonth(): number {
  const now = new Date();
  return now.getFullYear() * 100 + (now.getMonth() + 1);
}

/**
 * Log an API usage event to the usage_logs collection
 */
export async function logUsage(
  userId: string,
  model: string,
  endpoint: string,
  inputTokens: number = 0,
  outputTokens: number = 0
): Promise<void> {
  try {
    await adminDb.collection('usage_logs').add({
      userId,
      model,
      endpoint,
      inputTokens,
      outputTokens,
      timestamp: new Date(),
      month: getCurrentMonth(),
    });

    // Also increment the user's usage counter
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const planId = userData?.planId || 'free';

      // For free tier: track totalFreeChatsUsed
      if (planId === 'free') {
        await userRef.update({
          totalFreeChatsUsed: FieldValue.increment(1),
        });
      } else {
        // For paid tiers: track monthly usage
        const userMonth = userData?.currentMonth || getCurrentMonth();
        let newUsage = (userData?.currentUsage || 0) + 1;

        // Reset usage if month has changed
        if (userMonth !== getCurrentMonth()) {
          await userRef.update({
            currentMonth: getCurrentMonth(),
            currentUsage: 1,
          });
          newUsage = 1;
        } else {
          await userRef.update({
            currentUsage: FieldValue.increment(1),
          });
        }

        // Check if we should send notification (non-blocking)
        const limit = TIER_LIMITS[planId] || TIER_LIMITS.free;
        if (userData?.notificationsEnabled !== false) {
          // Only check notifications for paid users who have them enabled
          await checkAndNotifyUser(userId, planId, newUsage, limit).catch((err) => {
            console.error('Notification check failed:', err);
            // Don't fail the API call
          });
        }
      }
    }
  } catch (error) {
    console.error('Error logging usage:', error);
    // Don't throw - we don't want to fail the API call if logging fails
  }
}

/**
 * Check if user is within their quota
 * Free users get 3 total free chats, then must upgrade
 * Paid users get their tier's monthly limit with soft/hard caps
 */
export async function checkQuota(
  userId: string
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  requiresPayment?: boolean;
  nearLimit?: boolean;
  percentageUsed?: number;
}> {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // New user gets 3 free chats
      return { allowed: true, remaining: 3, limit: 3 };
    }

    const userData = userDoc.data();
    const planId = userData?.planId || 'free';

    // Free tier: 3 total free chats (lifetime, not monthly)
    if (planId === 'free') {
      const totalUsage = userData?.totalFreeChatsUsed || 0;
      const remaining = Math.max(0, 3 - totalUsage);

      return {
        allowed: remaining > 0,
        remaining,
        limit: 3,
        requiresPayment: remaining === 0, // Trigger payment modal when exhausted
      };
    }

    // Paid tiers: monthly quota with soft/hard limits
    const limit = TIER_LIMITS[planId] || TIER_LIMITS.free;
    const softLimit = SOFT_LIMITS[planId] || limit;
    const currentMonth = getCurrentMonth();
    let usage = userData?.currentUsage || 0;

    if (userData?.currentMonth !== currentMonth) {
      // Month has changed, reset usage
      await userRef.update({
        currentMonth: currentMonth,
        currentUsage: 0,
      });
      usage = 0;
    }

    const remaining = Math.max(0, limit - usage);
    const percentageUsed = Math.round((usage / limit) * 100);
    const nearLimit = usage >= softLimit; // Warn if >= soft limit

    return {
      allowed: remaining > 0,
      remaining,
      limit,
      nearLimit,
      percentageUsed,
    };
  } catch (error) {
    console.error('Error checking quota:', error);
    return { allowed: false, remaining: 0, limit: 0 };
  }
}

/**
 * Get detailed usage statistics for current month
 */
export async function getUsageStats(userId: string): Promise<{
  currentUsage: number;
  monthlyLimit: number;
  percentageUsed: number;
  planId: string;
  currentMonth: number;
}> {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        currentUsage: 0,
        monthlyLimit: 0,
        percentageUsed: 0,
        planId: 'free',
        currentMonth: getCurrentMonth(),
      };
    }

    const userData = userDoc.data();
    const planId = userData?.planId || 'free';
    const limit = TIER_LIMITS[planId] || TIER_LIMITS.free;
    const usage = userData?.currentUsage || 0;

    return {
      currentUsage: usage,
      monthlyLimit: limit,
      percentageUsed: limit > 0 ? Math.round((usage / limit) * 100) : 0,
      planId,
      currentMonth: getCurrentMonth(),
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      currentUsage: 0,
      monthlyLimit: 0,
      percentageUsed: 0,
      planId: 'free',
      currentMonth: getCurrentMonth(),
    };
  }
}

/**
 * Reset usage at month boundary (called by Cloud Function or cron job)
 */
export async function resetMonthlyUsageForUser(userId: string): Promise<void> {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const currentMonth = getCurrentMonth();

    await userRef.update({
      currentMonth,
      currentUsage: 0,
    });
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
  }
}
