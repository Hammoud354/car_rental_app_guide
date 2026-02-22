// Currency conversion constants for Lebanese Pounds
export const DEFAULT_USD_TO_LBP_RATE = 89700;
export const DEFAULT_VAT_RATE = 11; // 11% VAT (default)

export function convertUSDToLBP(usdAmount: number, exchangeRate: number = DEFAULT_USD_TO_LBP_RATE): number {
  return usdAmount * exchangeRate;
}

/**
 * Calculate VAT on an amount
 * @param amount - The amount to calculate VAT on
 * @param vatRate - VAT rate as a percentage (e.g., 11 for 11%), defaults to 11%
 * @returns VAT amount
 */
export function calculateVAT(amount: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return amount * (vatRate / 100);
}

export function formatLBP(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' LBP';
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
