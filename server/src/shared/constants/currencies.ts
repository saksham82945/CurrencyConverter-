export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'INR' | 'PKR' | 'AED' | 'MVR';

export const ALL_SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'INR',
  'PKR',
  'AED',
  'MVR'
];

export interface CurrencyConfig {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  minorUnitName: string;
  factor: number; // 100 for cents, 1 for yen, etc.
  decimals: number;
  sampleFormatted: string;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  MVR: {
    code: 'MVR',
    name: 'Maldivian Rufiyaa',
    symbol: 'MVR ',
    minorUnitName: 'Laari',
    factor: 100,
    decimals: 2,
    sampleFormatted: 'MVR 500.00'
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnitName: 'Cent',
    factor: 100,
    decimals: 2,
    sampleFormatted: '$1,250.00'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorUnitName: 'Cent',
    factor: 100,
    decimals: 2,
    sampleFormatted: '€1,250.00'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    minorUnitName: 'Penny',
    factor: 100,
    decimals: 2,
    sampleFormatted: '£1,250.00'
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    minorUnitName: 'Yen',
    factor: 1,
    decimals: 0,
    sampleFormatted: '¥125,000'
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    minorUnitName: 'Cent',
    factor: 100,
    decimals: 2,
    sampleFormatted: 'CA$1,250.00'
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    minorUnitName: 'Paisa',
    factor: 100,
    decimals: 2,
    sampleFormatted: '₹1,250.00'
  },
  PKR: {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    minorUnitName: 'Paisa',
    factor: 100,
    decimals: 2,
    sampleFormatted: '₨1,250.00'
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED ',
    minorUnitName: 'Fils',
    factor: 100,
    decimals: 2,
    sampleFormatted: 'AED 1,250.00'
  }
};

import { getWorldCurrency } from './worldCurrencies';

/**
 * Format minor units into user-friendly currency string
 */
export function formatMinorUnits(amountMinorUnits: number, currency: SupportedCurrency | string): string {
  const cleanCode = (currency || 'USD').split('_')[0].toUpperCase();
  const config = SUPPORTED_CURRENCIES[cleanCode as SupportedCurrency];

  if (config) {
    const majorUnits = amountMinorUnits / config.factor;
    const locale =
      cleanCode === 'INR'
        ? 'en-IN'
        : cleanCode === 'PKR'
        ? 'en-PK'
        : cleanCode === 'AED'
        ? 'en-AE'
        : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(majorUnits);
  }

  // Fallback to world currency catalog
  const worldCurr = getWorldCurrency(cleanCode);
  const factor = Math.pow(10, worldCurr.decimals);
  const major = amountMinorUnits / factor;
  return `${worldCurr.symbol}${major.toLocaleString('en-US', {
    minimumFractionDigits: worldCurr.decimals,
    maximumFractionDigits: worldCurr.decimals
  })}`;
}

/**
 * Convert user string input (e.g. "12.50") into integer minor units safely
 */
export function parseToMinorUnits(input: string | number, currency: SupportedCurrency | string): number {
  const cleanCode = (currency || 'USD').split('_')[0].toUpperCase();
  const config = SUPPORTED_CURRENCIES[cleanCode as SupportedCurrency];
  const num = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(num) || num < 0) return 0;

  if (config) {
    return Math.round(num * config.factor);
  }

  const worldCurr = getWorldCurrency(cleanCode);
  const factor = Math.pow(10, worldCurr.decimals);
  return Math.round(num * factor);
}

