import { apiClient } from './client';
import { UserDTO, AccountDTO, BeneficiaryDTO, VirtualCardDTO, ExchangeRateDTO } from '../../../shared/types/account.types';
import { InstitutionDTO } from '../../../shared/types/institution.types';
import { TrialBalanceDTO } from '../../../shared/types/ledger.types';

export const AuthAPI = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data.data;
  },
  register: async (fullName: string, email: string, password: string) => {
    const res = await apiClient.post('/auth/register', { fullName, email, password });
    return res.data.data;
  },
  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data.data.user as UserDTO;
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('bml_token');
    localStorage.removeItem('bml_user');
    localStorage.removeItem('nexapay_token');
    localStorage.removeItem('nexapay_user');
  },
  updatePin: async (pin: string) => {
    const res = await apiClient.patch('/auth/pin', { pin });
    return res.data.data;
  },
  upgradeKyc: async () => {
    const res = await apiClient.post('/auth/upgrade-kyc');
    return res.data.data.user as UserDTO;
  }
};

export const AccountsAPI = {
  list: async () => {
    const res = await apiClient.get('/accounts');
    return res.data.data as {
      accounts: AccountDTO[];
      totalNetWorthUSDMinorUnits: number;
      totalNetWorthUSDFormatted: string;
    };
  },
  create: async (currency: string, accountType = 'CHECKING', nickname?: string) => {
    const res = await apiClient.post('/accounts', { currency, accountType, nickname });
    return res.data.data.account as AccountDTO;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/accounts/${id}`);
    return res.data.data.account as AccountDTO;
  },
  getEntries: async (id: string, page = 1, limit = 20) => {
    const res = await apiClient.get(`/accounts/${id}/entries?page=${page}&limit=${limit}`);
    return res.data.data as {
      items: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }
};

export const TransfersAPI = {
  transferInternal: async (data: {
    sourceAccountId: string;
    recipientIdentifier: string;
    amountMinorUnits: number;
    description?: string;
    simulatedPin?: string;
  }) => {
    const res = await apiClient.post('/transfers/internal', data);
    return res.data.data;
  },
  transferExternal: async (data: {
    sourceAccountId: string;
    institutionRoutingOrBic: string;
    beneficiaryName: string;
    beneficiaryAccountNumber: string;
    amountMinorUnits: number;
    rail: string;
    description?: string;
    simulatedPin?: string;
  }) => {
    const res = await apiClient.post('/transfers/external', data);
    return res.data.data;
  },
  fxSwap: async (data: {
    fromAccountId: string;
    toAccountId: string;
    fromAmountMinorUnits: number;
  }) => {
    const res = await apiClient.post('/transfers/fx-swap', data);
    return res.data.data;
  },
  getReceipt: async (entryNumber: string) => {
    const res = await apiClient.get(`/transfers/${entryNumber}/receipt`);
    return res.data.data;
  }
};

export const CardsAPI = {
  list: async () => {
    const res = await apiClient.get('/cards');
    return res.data.data.cards as VirtualCardDTO[];
  },
  issue: async (data: {
    accountId: string;
    cardholderName: string;
    brand: 'VISA' | 'MASTERCARD';
    spendingLimitMonthlyMinorUnits?: number;
  }) => {
    const res = await apiClient.post('/cards', data);
    return res.data.data.card as VirtualCardDTO;
  },
  updateStatus: async (id: string, status: 'ACTIVE' | 'FROZEN' | 'TERMINATED') => {
    const res = await apiClient.patch(`/cards/${id}/status`, { status });
    return res.data.data.card as VirtualCardDTO;
  },
  updateLimits: async (id: string, spendingLimitMonthlyMinorUnits: number) => {
    const res = await apiClient.patch(`/cards/${id}/limits`, { spendingLimitMonthlyMinorUnits });
    return res.data.data.card as VirtualCardDTO;
  },
  revealPan: async (id: string) => {
    const res = await apiClient.post(`/cards/${id}/reveal-pan`);
    return res.data.data as { fullPan: string; cvv: string };
  },
  simulateCharge: async (id: string, data: { merchantName: string; amountMinorUnits: number }) => {
    const res = await apiClient.post(`/cards/${id}/simulate-charge`, data);
    return res.data.data;
  }
};

export const BeneficiariesAPI = {
  list: async () => {
    const res = await apiClient.get('/beneficiaries');
    return res.data.data.beneficiaries as BeneficiaryDTO[];
  },
  create: async (data: {
    name: string;
    type: 'INTERNAL_NEXAPAY' | 'EXTERNAL_BANK';
    identifier: string;
    routingOrBic?: string;
    institutionName?: string;
    currency: string;
  }) => {
    const res = await apiClient.post('/beneficiaries', data);
    return res.data.data.beneficiary as BeneficiaryDTO;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/beneficiaries/${id}`);
  }
};

export const DirectoryAPI = {
  search: async (params?: { q?: string; country?: string; currency?: string; rail?: string }) => {
    const res = await apiClient.get('/directory/institutions', { params });
    return res.data.data.institutions as InstitutionDTO[];
  }
};

export const FxAPI = {
  getRates: async () => {
    const res = await apiClient.get('/fx/rates');
    return res.data.data.rates as ExchangeRateDTO[];
  },
  getQuote: async (from: string, to: string, amountMinorUnits: number) => {
    const res = await apiClient.get(`/fx/quote?from=${from}&to=${to}&amountMinorUnits=${amountMinorUnits}`);
    return res.data.data;
  }
};

export const FaucetAPI = {
  inject: async (accountId: string, amountMinorUnits: number) => {
    const res = await apiClient.post('/faucet/inject', { accountId, amountMinorUnits });
    return res.data.data;
  }
};

export const AdminAPI = {
  getTrialBalance: async () => {
    const res = await apiClient.get('/admin/ledger/trial-balance');
    return res.data.data.trialBalance as TrialBalanceDTO;
  },
  auditInvariants: async () => {
    const res = await apiClient.get('/admin/ledger/audit');
    return res.data.data.audit;
  },
  getAuditLogs: async (page = 1, limit = 50) => {
    const res = await apiClient.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
    return res.data.data;
  }
};
