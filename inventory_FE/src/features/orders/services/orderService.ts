import apiClient from '@/api/axios';
import { Order, ApiResponse, PaginatedResponse } from '@/types';

export const orderService = {
  async getOrders(params: { page?: number; search?: string; status?: string; category?: string } = {}): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get('/orders/v1/orders/', { params });
    return response.data;
  },

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get(`/orders/v1/orders/${id}/`);
    return response.data;
  },

  async createOrder(data: Partial<Order>): Promise<ApiResponse<Order>> {
    const response = await apiClient.post('/orders/v1/orders/', data);
    return response.data;
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<ApiResponse<Order>> {
    const response = await apiClient.patch(`/orders/v1/orders/${id}/`, data);
    return response.data;
  },

  async deleteOrder(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/orders/v1/orders/${id}/`);
    return response.data;
  },

  async cancelOrder(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post(`/orders/v1/orders/${id}/cancel/`);
    return response.data;
  },
};
