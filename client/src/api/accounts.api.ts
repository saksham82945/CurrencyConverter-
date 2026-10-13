import { apiClient } from './client';
import { AccountDTO, AccountType } from '@shared/types/account.types';
import { SupportedCurrency } from '@shared/constants/currencies';
import { LedgerLineDTO } from '@shared/types/ledger.types';
import { ApiSuccessResponse } from '@shared/types/api.types';

export interface AccountsListResponse {
  accounts: AccountDTO[];
  totalNetWorthUSDMinorUnits: number;
  totalNetWorthUSDFormatted: string;
}

export interface AccountDetailResponse {
  account: AccountDTO;
  ledgerLines: LedgerLineDTO[];
}

export interface AccountEntriesResponse {
  items: LedgerLineDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const accountsApi = {
  async listAccounts(): Promise<AccountsListResponse> {
    const res = await apiClient.get<ApiSuccessResponse<AccountsListResponse>>('/accounts');
    return res.data.data;
  },

  async createAccount(currency: SupportedCurrency | string, accountType: AccountType = 'CHECKING', nickname?: string): Promise<{ account: AccountDTO }> {
    const res = await apiClient.post<ApiSuccessResponse<{ account: AccountDTO }>>('/accounts', {
      currency,
      accountType,
      nickname
    });
    return res.data.data;
  },

  async getAccountById(id: string): Promise<AccountDetailResponse> {
    const res = await apiClient.get<ApiSuccessResponse<AccountDetailResponse>>(`/accounts/${id}`);
    return res.data.data;
  },

  async getAccountEntries(id: string, page = 1, limit = 20): Promise<AccountEntriesResponse> {
    const res = await apiClient.get<ApiSuccessResponse<AccountEntriesResponse>>(`/accounts/${id}/entries?page=${page}&limit=${limit}`);
    return res.data.data;
  }
};
