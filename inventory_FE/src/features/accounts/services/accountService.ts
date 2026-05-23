import apiClient from '@/api/axios';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  date_of_birth: string | null;
  address: string;
  state: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  name?: string;
  date_of_birth?: string | null;
  address?: string;
  state?: string;
  city?: string;
}

export const accountService = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/accounts/v1/profile/');
    return response.data;
  },

  async updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
    const response = await apiClient.patch('/accounts/v1/profile/', data);
    return response.data;
  },
};
