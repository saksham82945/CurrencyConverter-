import { apiClient } from './client';
import { ApiSuccessResponse } from '@shared/types/api.types';
import { ExchangeRateDTO } from '@shared/types/account.types';
import { SupportedCurrency } from '@shared/constants/currencies';

export interface FxQuoteResponse {
  from?: string;
  to?: string;
  fromCurrency?: string;
  toCurrency?: string;
  rate?: number;
  appliedRate: number;
  fromAmountMinorUnits?: number;
  fromAmountFormatted?: string;
  fromFormatted?: string;
  toAmountMinorUnits?: number;
  toAmountFormatted?: string;
  toFormatted?: string;
  feeMinorUnits?: number;
  feeFormatted?: string;
  feeBps?: number;
  spreadBps?: number;
}

export interface LiveRatesResponse {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  provider: string;
  count: number;
}

export const fxApi = {
  async getRates(): Promise<{ rates: ExchangeRateDTO[] }> {
    const res = await apiClient.get<ApiSuccessResponse<{ rates: ExchangeRateDTO[] }>>('/fx/rates');
    return res.data.data;
  },

  async getQuote(from: string, to: string, amountMinorUnits: number): Promise<FxQuoteResponse> {
    const res = await apiClient.get<ApiSuccessResponse<FxQuoteResponse>>(
      `/fx/quote?from=${from}&to=${to}&amountMinorUnits=${amountMinorUnits}`
    );
    return res.data.data;
  },

  async getLiveRates(): Promise<LiveRatesResponse> {
    const res = await apiClient.get<ApiSuccessResponse<LiveRatesResponse>>('/fx/live-rates');
    return res.data.data;
  },

  async syncRates(): Promise<any> {
    const res = await apiClient.post<ApiSuccessResponse<any>>('/fx/sync-rates');
    return res.data.data;
  }
  
};
