import { apiClient } from './client';
import { VirtualCardDTO } from '@shared/types/account.types';
import { ApiSuccessResponse } from '@shared/types/api.types';

export interface IssueCardPayload {
  accountId: string;
  cardholderName: string;
  brand?: 'VISA' | 'MASTERCARD';
  spendingLimitMonthlyMinorUnits?: number;
}

export interface SimulateChargePayload {
  merchantName: string;
  amountMinorUnits: number;
}

export interface SimulateChargeResult {
  journalEntryId: string;
  entryNumber: string;
  status: string;
  amountMinorUnits: number;
  currency: string;
  merchantName: string;
  remainingLimitMinorUnits: number;
  remainingLimitFormatted: string;
  receiptHash: string;
  postedAt: string;
}

export const cardsApi = {
  async listCards(): Promise<{ cards: VirtualCardDTO[] }> {
    const res = await apiClient.get<ApiSuccessResponse<{ cards: VirtualCardDTO[] }>>('/cards');
    return res.data.data;
  },

  async issueCard(payload: IssueCardPayload): Promise<{ card: VirtualCardDTO }> {
    const res = await apiClient.post<ApiSuccessResponse<{ card: VirtualCardDTO }>>('/cards', payload);
    return res.data.data;
  },

  async updateCardStatus(id: string, status: 'ACTIVE' | 'FROZEN' | 'TERMINATED'): Promise<{ card: VirtualCardDTO }> {
    const res = await apiClient.patch<ApiSuccessResponse<{ card: VirtualCardDTO }>>(`/cards/${id}/status`, { status });
    return res.data.data;
  },

  async updateCardLimits(id: string, spendingLimitMonthlyMinorUnits: number): Promise<{ card: VirtualCardDTO }> {
    const res = await apiClient.patch<ApiSuccessResponse<{ card: VirtualCardDTO }>>(`/cards/${id}/limits`, {
      spendingLimitMonthlyMinorUnits
    });
    return res.data.data;
  },

  async revealPan(id: string): Promise<{ fullPan: string; cvv: string }> {
    const res = await apiClient.post<ApiSuccessResponse<{ fullPan: string; cvv: string }>>(`/cards/${id}/reveal-pan`);
    return res.data.data;
  },

  async simulatePosCharge(id: string, payload: SimulateChargePayload): Promise<SimulateChargeResult> {
    const res = await apiClient.post<ApiSuccessResponse<SimulateChargeResult>>(`/cards/${id}/simulate-charge`, payload);
    return res.data.data;
  }
};
