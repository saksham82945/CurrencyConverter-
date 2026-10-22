import { apiClient } from './client';
import { ApiSuccessResponse } from '@shared/types/api.types';
import { JournalEntryDTO } from '@shared/types/ledger.types';

export interface InternalTransferPayload {
  sourceAccountId: string;
  recipientIdentifier: string;
  recipientName?: string;
  amountMinorUnits: number;
  targetCurrency?: string;
  description?: string;
  simulatedPin?: string;
}

export interface ExternalTransferPayload {
  sourceAccountId: string;
  institutionRoutingOrBic: string;
  institutionName?: string;
  beneficiaryName: string;
  beneficiaryAccountNumber: string;
  amountMinorUnits: number;
  rail?: string;
  targetCurrency?: string;
  description?: string;
  simulatedPin?: string;
}

export interface MultiCurrencyTransferPayload {
  sourceAccountId: string;
  targetCurrency: string;
  sourceAmountMinorUnits: number;
  transferType: 'EXTERNAL_BANK' | 'INTERNAL_NEXAPAY';
  institutionRoutingOrBic?: string;
  institutionName?: string;
  beneficiaryName?: string;
  beneficiaryAccountNumber?: string;
  rail?: string;
  recipientIdentifier?: string;
  description?: string;
  simulatedPin?: string;
}

export interface FxSwapPayload {
  fromAccountId: string;
  toAccountId: string;
  fromAmountMinorUnits: number;
}

export interface TransferResult {
  journalEntryId: string;
  entryNumber: string;
  status: string;
  amountMinorUnits?: number;
  amountFormatted?: string;
  currency?: string;
  targetCurrency?: string;
  creditedMinorUnits?: number;
  creditedFormatted?: string;
  appliedRate?: number;
  feeMinorUnits?: number;
  feeFormatted?: string;
  recipientName?: string;
  beneficiaryName?: string;
  institutionName?: string;
  receiptHash: string;
  postedAt: string;
}

export interface FxSwapResult {
  entryNumber: string;
  fromCurrency: string;
  toCurrency: string;
  debitedMinorUnits: number;
  debitedFormatted?: string;
  creditedMinorUnits: number;
  creditedFormatted?: string;
  appliedRate: number;
  feeMinorUnits: number;
  receiptHash: string;
  postedAt: string;
}

export interface ReceiptData {
  entryNumber: string;
  referenceType: string;
  description: string;
  status: string;
  postedAt: string;
  receiptHash?: string;
  receiptFingerprintHex?: string;
  disclaimer?: string;
  metadata: Record<string, any>;
  lines: Array<{
    accountCode?: string;
    accountName?: string;
    direction: string;
    amountMinorUnits?: number;
    amountFormatted: string;
    currency?: string;
    balanceAfterFormatted?: string;
  }>;
  simulatedDisclaimer?: string;
}

export const transfersApi = {
  async transferInternal(payload: InternalTransferPayload): Promise<TransferResult> {
    const res = await apiClient.post<ApiSuccessResponse<TransferResult>>('/transfers/internal', payload);
    return res.data.data;
  },

  async transferExternal(payload: ExternalTransferPayload): Promise<TransferResult> {
    const res = await apiClient.post<ApiSuccessResponse<TransferResult>>('/transfers/external', payload);
    return res.data.data;
  },

  async transferMultiCurrency(payload: MultiCurrencyTransferPayload): Promise<TransferResult> {
    const res = await apiClient.post<ApiSuccessResponse<TransferResult>>('/transfers/multi-currency', payload);
    return res.data.data;
  },

  async transferFxSwap(payload: FxSwapPayload): Promise<FxSwapResult> {
    const res = await apiClient.post<ApiSuccessResponse<FxSwapResult>>('/transfers/fx-swap', payload);
    return res.data.data;
  },

  async getReceipt(entryNumber: string): Promise<ReceiptData> {
    const res = await apiClient.get<ApiSuccessResponse<ReceiptData>>(`/transfers/${entryNumber}/receipt`);
    return res.data.data;
  }
};
