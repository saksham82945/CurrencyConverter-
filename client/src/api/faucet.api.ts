import { apiClient } from './client';
import { ApiSuccessResponse } from '@shared/types/api.types';

export interface FaucetInjectResponse {
  journalEntryId: string;
  entryNumber: string;
  accountId: string;
  amountMinorUnits: number;
  amountFormatted: string;
  currency: string;
  newAccountBalanceFormatted: string;
  receiptHash: string;
  postedAt: string;
}

export const faucetApi = {
  async injectLiquidity(accountId: string, amountMinorUnits: number): Promise<FaucetInjectResponse> {
    const res = await apiClient.post<ApiSuccessResponse<FaucetInjectResponse>>('/faucet/inject', {
      accountId,
      amountMinorUnits
    });
    return res.data.data;
  }
};
