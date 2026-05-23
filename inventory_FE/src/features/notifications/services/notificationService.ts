import apiClient from '@/api/axios';
import { Notification, ApiResponse, PaginatedResponse } from '@/types';

export const notificationService = {
  async getNotifications(): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get('/notifications/v1/notifications/');
    return response.data;
  },

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.patch(`/notifications/v1/notifications/${id}/`, { isRead: true });
    return response.data;
  },
};
