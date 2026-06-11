import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Pricing configuration
export const PRICING = {
  free: {
    planId: 'free',
    name: 'Free',
    monthlyQuota: 3,
    priceInPaise: 0,
  },
  professional: {
    planId: 'professional',
    name: 'Professional',
    monthlyQuota: 100,
    priceInPaise: 29900, // ₹299
  },
  ca: {
    planId: 'ca',
    name: 'Chartered Accountant',
    monthlyQuota: 10000, // Unlimited
    priceInPaise: 99900, // ₹999
  },
};

export function getPricingByPlanId(planId: string) {
  return PRICING[planId as keyof typeof PRICING] || PRICING.free;
}
