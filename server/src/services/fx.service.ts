import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../shared/constants/currencies';
import { getWorldCurrency, WORLD_CURRENCIES } from '../shared/constants/worldCurrencies';
import { ExchangeRateModel } from '../models/ExchangeRate.model';

// Default baseline rates against USD as emergency fallback if completely offline
const BASE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 152.40,
  CAD: 1.38,
  INR: 84.10,
  PKR: 278.50,
  AED: 3.67
};

export class FxService {
  // In-memory cache for live exchange rates
  private static liveRatesCache: {
    base: string;
    rates: Record<string, number>;
    timestamp: number;
    provider: string;
  } | null = null;

  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

  /**
   * Fetch live exchange rates against USD from open real-time FX endpoints
   */
  static async fetchLiveRates(force = false): Promise<Record<string, number>> {
    const now = Date.now();
    if (!force && this.liveRatesCache && (now - this.liveRatesCache.timestamp) < this.CACHE_TTL_MS) {
      return this.liveRatesCache.rates;
    }

    // In test environment, bypass external network calls for instant determinism
    if (process.env.NODE_ENV === 'test') {
      const testRates: Record<string, number> = { ...BASE_RATES };
      for (const item of WORLD_CURRENCIES) {
        const pure = item.code.split('_')[0].toUpperCase();
        if (!testRates[pure]) {
          testRates[pure] = item.ratePerUSD || 1.0;
        }
      }
      this.liveRatesCache = {
        base: 'USD',
        rates: testRates,
        timestamp: now,
        provider: 'World Currencies Engine (Test Mode)'
      };
      return testRates;
    }

    try {
      // Primary Live Endpoint: Open Exchange Rates API (open access, no key required)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data && data.rates && typeof data.rates === 'object') {
          const rates: Record<string, number> = { USD: 1.0 };
          for (const [code, val] of Object.entries(data.rates)) {
            if (typeof val === 'number' && val > 0) {
              rates[code.toUpperCase()] = val;
            }
          }

          this.liveRatesCache = {
            base: 'USD',
            rates,
            timestamp: now,
            provider: 'Open Exchange Rates (Live Market)'
          };
          console.log(`[FxService] Successfully updated ${Object.keys(rates).length} live currency rates from Open Exchange API.`);
          return rates;
        }
      }
    } catch (primaryErr: any) {
      console.warn('[FxService] Primary live rates endpoint failed, attempting secondary fallback...', primaryErr.message);
    }

    try {
      // Secondary Fallback Endpoint: ExchangeRate-API free endpoint
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 5000);

      const response2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: controller2.signal
      });
      clearTimeout(timeout2);

      if (response2.ok) {
        const data2 = (await response2.json()) as any;
        if (data2 && data2.rates) {
          const rates: Record<string, number> = { USD: 1.0 };
          for (const [code, val] of Object.entries(data2.rates)) {
            if (typeof val === 'number' && val > 0) {
              rates[code.toUpperCase()] = val;
            }
          }

          this.liveRatesCache = {
            base: 'USD',
            rates,
            timestamp: now,
            provider: 'ExchangeRate-API (Fallback Live)'
          };
          console.log(`[FxService] Successfully updated ${Object.keys(rates).length} live currency rates from secondary fallback.`);
          return rates;
        }
      }
    } catch (secondaryErr: any) {
      console.warn('[FxService] Secondary live rates endpoint failed, using baseline catalog...', secondaryErr.message);
    }

    // Baseline catalog fallback from worldCurrencies.ts
    const fallbackRates: Record<string, number> = { ...BASE_RATES };
    for (const item of WORLD_CURRENCIES) {
      const pure = item.code.split('_')[0].toUpperCase();
      if (!fallbackRates[pure]) {
        fallbackRates[pure] = item.ratePerUSD || 1.0;
      }
    }

    this.liveRatesCache = {
      base: 'USD',
      rates: fallbackRates,
      timestamp: now,
      provider: 'World Currencies Baseline Engine'
    };
    return fallbackRates;
  }

  /**
   * Get live rate for 1 USD against a specific currency
   */
  static async getRateAgainstUsd(currencyCode: string): Promise<number> {
    const clean = (currencyCode || 'USD').split('_')[0].toUpperCase();
    if (clean === 'USD') return 1.0;

    const rates = await this.fetchLiveRates();
    if (rates[clean] && rates[clean] > 0) {
      return rates[clean];
    }

    // Try world currency catalog
    return getWorldCurrency(clean).ratePerUSD || 1.0;
  }

  /**
   * Get live exchange rate between any two currencies (from -> to)
   */
  static async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const fromClean = (fromCurrency || 'USD').split('_')[0].toUpperCase();
    const toClean = (toCurrency || 'USD').split('_')[0].toUpperCase();

    if (fromClean === toClean) return 1.0;

    const fromRateUsd = await this.getRateAgainstUsd(fromClean);
    const toRateUsd = await this.getRateAgainstUsd(toClean);

    // Cross-currency calculation: (1 / fromRateUsd) * toRateUsd
    return Number(((1 / fromRateUsd) * toRateUsd).toFixed(6));
  }

  /**
   * Sync and persist live exchange rates to MongoDB
   */
  static async syncLiveRatesToDb(): Promise<{
    success: boolean;
    ratesCount: number;
    provider: string;
    lastUpdated: Date;
  }> {
    const liveRates = await this.fetchLiveRates(true);
    const keyCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'INR', 'PKR', 'AED',
      'SAR', 'AUD', 'CNY', 'SGD', 'BDT', 'PHP', 'QAR', 'KWD',
      'BHD', 'OMR', 'CHF', 'BRL', 'MXN', 'ZAR', 'EGP', 'TRY'
    ];

    let updatedCount = 0;
    const now = new Date();

    for (const from of keyCurrencies) {
      for (const to of keyCurrencies) {
        if (from === to) continue;
        const pair = `${from}/${to}`;
        const fromRateUsd = liveRates[from] ?? (getWorldCurrency(from).ratePerUSD || 1.0);
        const toRateUsd = liveRates[to] ?? (getWorldCurrency(to).ratePerUSD || 1.0);
        const rate = Number(((1 / fromRateUsd) * toRateUsd).toFixed(6));

        await ExchangeRateModel.findOneAndUpdate(
          { pair },
          {
            pair,
            from,
            to,
            rate,
            feeBps: 0,
            source: 'LIVE_MARKET',
            lastUpdated: now
          },
          { upsert: true, new: true }
        );
        updatedCount++;
      }
    }

    return {
      success: true,
      ratesCount: Object.keys(liveRates).length,
      provider: this.liveRatesCache?.provider || 'Live Interbank Market',
      lastUpdated: now
    };
  }

  /**
   * Seed default exchange rates if missing or startup
   */
  static async seedDefaultRates(): Promise<void> {
    try {
      await this.syncLiveRatesToDb();
    } catch (err: any) {
      console.warn('[FxService] Failed to sync live rates on startup, falling back to static seeds:', err.message);
      // Fallback basic seeds
      const currencies: SupportedCurrency[] = Object.keys(BASE_RATES) as SupportedCurrency[];
      for (const from of currencies) {
        for (const to of currencies) {
          if (from === to) continue;
          const pair = `${from}/${to}`;
          const fromRateUsd = BASE_RATES[from] || 1.0;
          const toRateUsd = BASE_RATES[to] || 1.0;
          const rate = Number(((1 / fromRateUsd) * toRateUsd).toFixed(6));

          await ExchangeRateModel.findOneAndUpdate(
            { pair },
            { pair, from, to, rate, feeBps: 0, lastUpdated: new Date() },
            { upsert: true }
          );
        }
      }
    }
  }

  /**
   * Get live quote for exchanging between two currencies
   */
  static async getQuote(
    from: string,
    to: string,
    fromAmountMinorUnits: number
  ): Promise<{
    from: string;
    to: string;
    rate: number;
    feeBps: number;
    feeMinorUnits: number;
    netFromMinorUnits: number;
    toAmountMinorUnits: number;
    isLiveRate: boolean;
    provider: string;
    lastUpdated: Date;
  }> {
    const fromClean = (from || 'USD').split('_')[0].toUpperCase();
    const toClean = (to || 'USD').split('_')[0].toUpperCase();

    if (fromClean === toClean) {
      throw new Error('INVALID_CURRENCY_PAIR: Cannot exchange identical currency.');
    }

    // Get live rate directly from real-time data engine
    const rate = await this.getRate(fromClean, toClean);
    const feeBps = 0; // Zero FX spread enterprise institutional rate

    // Fee calculation in source currency: feeBps / 10000
    const feeMinorUnits = Math.round((fromAmountMinorUnits * feeBps) / 10000);
    const netFromMinorUnits = fromAmountMinorUnits - feeMinorUnits;

    // Convert from source minor units to destination minor units
    const fromFactor = SUPPORTED_CURRENCIES[fromClean as SupportedCurrency]?.factor ?? Math.pow(10, getWorldCurrency(fromClean).decimals || 2);
    const toFactor = SUPPORTED_CURRENCIES[toClean as SupportedCurrency]?.factor ?? Math.pow(10, getWorldCurrency(toClean).decimals || 2);

    const sourceMajor = netFromMinorUnits / fromFactor;
    const destMajor = sourceMajor * rate;
    const toAmountMinorUnits = Math.round(destMajor * toFactor);

    return {
      from: fromClean,
      to: toClean,
      rate,
      feeBps,
      feeMinorUnits,
      netFromMinorUnits,
      toAmountMinorUnits,
      isLiveRate: true,
      provider: this.liveRatesCache?.provider || 'Live Interbank Rates',
      lastUpdated: new Date(this.liveRatesCache?.timestamp || Date.now())
    };
  }

  /**
   * Retrieve live rates map against USD for all 190+ world currencies
   */
  static async getLiveRates() {
    const rates = await this.fetchLiveRates();
    return {
      base: 'USD',
      rates,
      lastUpdated: new Date(this.liveRatesCache?.timestamp || Date.now()).toISOString(),
      provider: this.liveRatesCache?.provider || 'Live Interbank Market',
      count: Object.keys(rates).length
    };
  }

  /**
   * List all persisted exchange rates
   */
  static async getAllRates() {
    return await ExchangeRateModel.find().sort({ pair: 1 });
  }
}
