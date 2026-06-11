// Google Pay Configuration for India-based payments
// Uses Google Pay Web SDK for seamless integration

// Pricing configuration
export const PRICING = {
  free: {
    planId: 'free',
    name: 'Free',
    monthlyQuota: 3,
    priceInRupees: 0,
  },
  student: {
    planId: 'student',
    name: 'Student',
    monthlyQuota: 100,
    priceInRupees: 299,
  },
  professional: {
    planId: 'professional',
    name: 'Professional',
    monthlyQuota: 250,
    priceInRupees: 999,
  },
  ca: {
    planId: 'ca',
    name: 'Tax Professional/CA',
    monthlyQuota: 500,
    priceInRupees: 2000,
  },
};

export function getPricingByPlanId(planId: string) {
  return PRICING[planId as keyof typeof PRICING] || PRICING.free;
}

// Google Pay Payment Request Configuration
export function getGooglePaymentRequest(planId: string, userEmail: string) {
  const pricing = getPricingByPlanId(planId);

  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY'],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'upi',
            gatewayMerchantId: process.env.NEXT_PUBLIC_GOOGLEPAY_MERCHANT_ID || '',
          },
        },
      },
      {
        type: 'UPI',
        parameters: {
          payeeAddress: process.env.NEXT_PUBLIC_UPI_ID || '',
        },
      },
    ],
    merchantInfo: {
      merchantName: 'BigReddy Income Tax Pro',
      merchantId: process.env.NEXT_PUBLIC_GOOGLEPAY_MERCHANT_ID || '',
    },
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice: pricing.priceInRupees.toString(),
      currency: 'INR',
      transactionId: `txn_${Date.now()}`,
    },
    shippingAddressRequired: false,
    emailRequired: true,
    callbackIntents: ['PAYMENT_AUTHORIZATION'],
  };
}

// Generate a unique transaction ID
export function generateTransactionId(userId: string): string {
  return `txn_${userId}_${Date.now()}`;
}

// Check if Google Pay is available in the environment
export async function isGooglePayAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return !!(window as any).google?.payments?.api;
}
