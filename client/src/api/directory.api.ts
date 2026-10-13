import { apiClient } from './client';
import { ApiSuccessResponse } from '@shared/types/api.types';
import { SeedInstitution } from '@shared/constants/institutions';

export interface InstitutionItem extends SeedInstitution {
  _id: string;
}

export const directoryApi = {
  async searchInstitutions(params?: { q?: string; country?: string; rail?: string }): Promise<{ institutions: InstitutionItem[] }> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.country) query.append('country', params.country);
    if (params?.rail) query.append('rail', params.rail);

    const res = await apiClient.get<ApiSuccessResponse<{ institutions: InstitutionItem[] }>>(`/directory/institutions?${query.toString()}`);
    return res.data.data;
  },

  async createInstitution(payload: {
    name: string;
    routingNumber: string;
    bicSwift?: string;
    country?: string;
    supportedRail?: string;
    supportedCurrencies?: string[];
  }): Promise<{ institution: InstitutionItem }> {
    const res = await apiClient.post<ApiSuccessResponse<{ institution: InstitutionItem }>>('/directory/institutions', payload);
    return res.data.data;
  }
};
