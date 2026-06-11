import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to get usage analytics
 * Returns aggregated user statistics and cost breakdown
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is admin (check custom claim)
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    if (!userRecord.customClaims?.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users
    const usersSnapshot = await adminDb.collection('users').get();

    // Aggregate stats
    let totalUsers = 0;
    let freeUsers = 0;
    let professionalUsers = 0;
    let caUsers = 0;
    let totalMonthlyRevenue = 0;
    let totalMonthlyApiCost = 0;
    let usersByUsage: Record<string, number> = {
      '0-10': 0,
      '11-50': 0,
      '51-100': 0,
      '101-200': 0,
      '200+': 0,
    };

    interface UserData {
      email?: string;
      planId?: string;
      currentUsage?: number;
      totalFreeChatsUsed?: number;
    }

    const usersData: Array<{
      userId: string;
      email: string;
      plan: string;
      usage: number;
      percentageUsed: number;
      nearLimit: boolean;
    }> = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data() as UserData;
      totalUsers++;

      const plan = data.planId || 'free';
      const usage = plan === 'free' ? (data.totalFreeChatsUsed || 0) : (data.currentUsage || 0);

      // Plan counts
      if (plan === 'free') freeUsers++;
      else if (plan === 'student') freeUsers++; // Count student as subscriber
      else if (plan === 'professional') professionalUsers++;
      else if (plan === 'ca') caUsers++;

      // Revenue calculation (new pricing)
      if (plan === 'student') totalMonthlyRevenue += 299;
      else if (plan === 'professional') totalMonthlyRevenue += 999;
      else if (plan === 'ca') totalMonthlyRevenue += 2000;

      // API cost estimation
      const estimatedCostPerChat = plan === 'ca' ? 2.5 : 1.5;
      const estimatedMonthlyCost = usage * estimatedCostPerChat;
      totalMonthlyApiCost += estimatedMonthlyCost;

      // Usage distribution
      if (usage <= 10) usersByUsage['0-10']++;
      else if (usage <= 50) usersByUsage['11-50']++;
      else if (usage <= 100) usersByUsage['51-100']++;
      else if (usage <= 200) usersByUsage['101-200']++;
      else usersByUsage['200+']++;

      // User detail
      const limits = {
        free: 3,
        student: 100,
        professional: 250,
        ca: 500,
      };
      const limit = limits[plan as keyof typeof limits] || 3;
      const percentageUsed = Math.round((usage / limit) * 100);
      const nearLimit = usage >= (limit * 0.8); // 80% threshold

      usersData.push({
        userId: doc.id,
        email: data.email || 'unknown',
        plan,
        usage,
        percentageUsed,
        nearLimit,
      });
    });

    // Calculate profit
    const profit = totalMonthlyRevenue - totalMonthlyApiCost;
    const profitMargin = totalMonthlyRevenue > 0 ? Math.round((profit / totalMonthlyRevenue) * 100) : 0;

    return NextResponse.json({
      summary: {
        totalUsers,
        totalMonthlyRevenue,
        totalMonthlyApiCost,
        profit,
        profitMargin: `${profitMargin}%`,
      },
      userBreakdown: {
        free: freeUsers,
        professional: professionalUsers,
        ca: caUsers,
      },
      usageDistribution: usersByUsage,
      users: usersData.sort((a, b) => b.usage - a.usage), // Sort by usage desc
      topUsers: usersData.slice(0, 10), // Top 10 heavy users
      atRiskUsers: usersData.filter((u) => u.nearLimit).slice(0, 10), // Users near limit
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
