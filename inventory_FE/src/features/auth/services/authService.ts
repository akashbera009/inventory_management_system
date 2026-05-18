import apiClient from '@/api/axios';
import { User, ApiResponse } from '@/types';

export const authService = {
  async login(credentials: any): Promise<ApiResponse<{ token: string, user: User }>> {
    const response = await apiClient.post('/accounts/v1/login/', credentials);
    return response.data;
  },

  async register(userData: any): Promise<ApiResponse<{ token: string, user: User }>> {
    const response = await apiClient.post('/accounts/v1/register/', userData);
    return response.data;
  },
};
