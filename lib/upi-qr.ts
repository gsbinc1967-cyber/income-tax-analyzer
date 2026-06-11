// UPI QR Code Generator for receiving payments
// Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE&tr=TRANSACTION_ID

export interface UPIPaymentRequest {
  upiId: string;           // merchant@bankcode
  name: string;            // Merchant name
  amount: number;          // Amount in rupees
  note?: string;           // Payment note/description
  transactionId?: string;  // Unique transaction ID
}

/**
 * Generate UPI string for QR code
 * @param request - UPI payment request details
 * @returns UPI payment URI string
 */
export function generateUPIString(request: UPIPaymentRequest): string {
  const params = new URLSearchParams();

  // Required parameters
  params.append('pa', request.upiId);
  params.append('pn', encodeURIComponent(request.name));

  // Optional parameters
  if (request.amount > 0) {
    params.append('am', request.amount.toString());
  }

  if (request.note) {
    params.append('tn', encodeURIComponent(request.note));
  }

  if (request.transactionId) {
    params.append('tr', request.transactionId);
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate QR code data URL for UPI payment
 * Uses qrcode.js library (CDN)
 * @param request - UPI payment request details
 * @returns Promise<string> - Data URL of QR code
 */
export async function generateUPIQRCode(request: UPIPaymentRequest): Promise<string> {
  const upiString = generateUPIString(request);

  // Dynamic import of qrcode.js
  const QRCode = (await import('qrcode')).default;

  try {
    const dataURL = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return dataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate UPI ID format
 * @param upiId - UPI ID to validate (format: username@bankcode)
 * @returns boolean - True if valid UPI ID format
 */
export function validateUPIId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  return upiRegex.test(upiId);
}

/**
 * Get merchant UPI configuration from environment
 * @returns Object with UPI merchant details
 */
export function getMerchantUPIConfig() {
  return {
    upiId: process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi',
    name: process.env.NEXT_PUBLIC_UPI_NAME || 'Merchant',
  };
}

/**
 * Create payment request for QR code
 * @param amount - Amount in rupees
 * @param description - Payment description
 * @param transactionId - Optional transaction ID
 * @returns UPI payment request
 */
export function createPaymentRequest(
  amount: number,
  description: string = 'Payment',
  transactionId?: string
): UPIPaymentRequest {
  const config = getMerchantUPIConfig();

  return {
    upiId: config.upiId,
    name: config.name,
    amount,
    note: description,
    transactionId: transactionId || `TXN_${Date.now()}`,
  };
}
