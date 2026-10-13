import { apiClient } from './client';
import { ApiSuccessResponse } from '@shared/types/api.types';
import { TrialBalanceDTO } from '@shared/types/ledger.types';

export interface AuditInvariantsResponse {
  timestamp: string;
  totalJournalsEvaluated: number;
  unbalancedJournalsCount: number;
  invariantsMaintained: boolean;
  unbalancedDetails: any[];
}

export interface AuditLogItem {
  id: string;
  actorUserId?: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  changes?: Record<string, any>;
  timestamp: string;
}

export const adminApi = {
  async getTrialBalance(): Promise<{ trialBalance: TrialBalanceDTO }> {
    const res = await apiClient.get<ApiSuccessResponse<{ trialBalance: TrialBalanceDTO }>>('/admin/ledger/trial-balance');
    return res.data.data;
  },

  async getAuditInvariants(): Promise<{ audit: AuditInvariantsResponse }> {
    const res = await apiClient.get<ApiSuccessResponse<{ audit: AuditInvariantsResponse }>>('/admin/ledger/audit');
    return res.data.data;
  },

  async getAuditLogs(page = 1, limit = 50): Promise<{ logs: AuditLogItem[] }> {
    const res = await apiClient.get<ApiSuccessResponse<{ logs: AuditLogItem[] }>>(`/admin/audit-logs?page=${page}&limit=${limit}`);
    return res.data.data;
  }
};
