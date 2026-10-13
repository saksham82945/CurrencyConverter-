import crypto from 'crypto';

/**
 * Generate a deterministic SHA-256 fingerprint for a simulated transaction receipt
 */
export function generateReceiptHash(data: {
  entryNumber: string;
  sourceAccount: string;
  destinationAccount: string;
  amountMinorUnits: number;
  currency: string;
  timestamp: string;
}): string {
  const payloadString = `${data.entryNumber}|${data.sourceAccount}|${data.destinationAccount}|${data.amountMinorUnits}|${data.currency}|${data.timestamp}|NEXAPAY_SIMULATOR`;
  return crypto.createHash('sha256').update(payloadString).digest('hex');
}
