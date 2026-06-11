/**
 * UPI QR Code Payment Generation
 * Generate dynamic UPI strings and QR codes for Indian payment processing
 */

export interface UPIPaymentConfig {
  upiId: string; // merchant@bank (e.g., merchant@okhdfcbank)
  payeeName: string; // Merchant name
  amount: number; // Amount in rupees
  transactionRef: string; // Unique transaction reference
  description?: string; // Payment description
}

/**
 * Generate UPI string for QR code
 * Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=DESCRIPTION&tr=REFERENCE
 */
export function generateUPIString(config: UPIPaymentConfig): string {
  const params = new URLSearchParams({
    pa: config.upiId,
    pn: encodeURIComponent(config.payeeName),
    am: config.amount.toString(),
    tn: encodeURIComponent(config.description || 'Income Tax Analyser Subscription'),
    tr: config.transactionRef,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate QR code data URL
 * Returns canvas as data URL for display in img tag
 */
export async function generateQRCode(
  upiString: string,
  size: number = 300
): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(upiString, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Validate UPI ID format
 * Format: username@bankcode (e.g., merchant@okhdfcbank)
 */
export function isValidUPIId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
  return upiRegex.test(upiId);
}

/**
 * Parse UPI string to extract payment details
 * Used when scanning QR code response
 */
export function parseUPIResponse(responseString: string): Record<string, string> | null {
  try {
    const params = new URLSearchParams(responseString);
    const result: Record<string, string> = {};

    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  } catch (error) {
    console.error('Error parsing UPI response:', error);
    return null;
  }
}

/**
 * Format amount for display
 */
export function formatAmount(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
