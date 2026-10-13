import { apiClient } from './client';
import { UserDTO } from '@shared/types/account.types';
import { ApiSuccessResponse } from '@shared/types/api.types';

export interface AuthResponseData {
  user: UserDTO;
  accessToken: string;
}

export const authApi = {
  async register(fullName: string, email: string, password: string): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>('/auth/register', {
      fullName,
      email,
      password
    });
    return res.data.data;
  },

  async login(email: string, password: string): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>('/auth/login', {
      email,
      password
    });
    return res.data.data;
  },

  async me(): Promise<{ user: UserDTO }> {
    const res = await apiClient.get<ApiSuccessResponse<{ user: UserDTO }>>('/auth/me');
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('bml_token');
      localStorage.removeItem('bml_user');
      localStorage.removeItem('nexapay_token');
      localStorage.removeItem('nexapay_user');
    }
  },

  async updatePin(pin: string): Promise<{ message: string }> {
    const res = await apiClient.patch<ApiSuccessResponse<{ message: string }>>('/auth/pin', { pin });
    return res.data.data;
  },

  async upgradeKyc(): Promise<{ message: string; user: UserDTO }> {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string; user: UserDTO }>>('/auth/upgrade-kyc');
    return res.data.data;
  }
};
