// Currency conversion constants for Lebanese Pounds
export const DEFAULT_USD_TO_LBP_RATE = 89700;
export const VAT_RATE = 0.11; // 11% VAT

export function convertUSDToLBP(usdAmount: number, exchangeRate: number = DEFAULT_USD_TO_LBP_RATE): number {
  return usdAmount * exchangeRate;
}

export function calculateVAT(amount: number): number {
  return amount * VAT_RATE;
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
