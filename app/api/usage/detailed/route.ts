import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getUsageStats } from '@/lib/usage';

const PRICING_PER_TOKEN = {
  "claude-opus-4-7": { input: 0.00003, output: 0.00015 },
  "claude-sonnet-4-6": { input: 0.000003, output: 0.000015 },
};

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

    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'all':
        startDate = new Date(2000, 0, 1); // Beginning of time
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Fetch usage logs from Firestore
    const snapshot = await adminDb
      .collection('usage_logs')
      .where('userId', '==', decodedToken.uid)
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'desc')
      .get();

    const usageLogs: any[] = [];
    const modelBreakdown: Record<string, any> = {};
    const dailyUsage: Record<string, number> = {};
    let totalCost = 0;
    let totalTokens = 0;

    // Process logs
    snapshot.forEach((doc) => {
      const data = doc.data();
      const logTokens = data.inputTokens + data.outputTokens;

      // Calculate cost
      const pricing = PRICING_PER_TOKEN[data.model as keyof typeof PRICING_PER_TOKEN] ||
                     PRICING_PER_TOKEN['claude-opus-4-7'];
      const costInPaise = Math.round(
        (data.inputTokens * pricing.input + data.outputTokens * pricing.output) * 100
      );

      usageLogs.push({
        timestamp: data.timestamp.toDate().toISOString(),
        model: data.model,
        endpoint: data.endpoint,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        costInPaise,
      });

      // Model breakdown
      if (!modelBreakdown[data.model]) {
        modelBreakdown[data.model] = { count: 0, tokens: 0, cost: 0 };
      }
      modelBreakdown[data.model].count++;
      modelBreakdown[data.model].tokens += logTokens;
      modelBreakdown[data.model].cost += costInPaise;

      // Daily usage
      const dateKey = data.timestamp.toDate().toISOString().split('T')[0];
      dailyUsage[dateKey] = (dailyUsage[dateKey] || 0) + 1;

      totalCost += costInPaise;
      totalTokens += logTokens;
    });

    // Get basic stats
    const baseStats = await getUsageStats(decodedToken.uid);

    const averageCostPerRequest = usageLogs.length > 0
      ? Math.round(totalCost / usageLogs.length)
      : 0;

    return NextResponse.json({
      ...baseStats,
      totalCost,
      averageCostPerRequest,
      usageLogs,
      modelBreakdown,
      dailyUsage,
    });
  } catch (error: any) {
    console.error('Detailed usage error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
