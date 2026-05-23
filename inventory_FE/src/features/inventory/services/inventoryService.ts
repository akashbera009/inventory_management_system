import apiClient from '@/api/axios';
import { InventoryItem, ApiResponse, PaginatedResponse } from '@/types';

export const inventoryService = {
  async getInventory(params: { page?: number; search?: string } = {}): Promise<PaginatedResponse<InventoryItem>> {
    const response = await apiClient.get('/inventory/v1/inventory/', { params });
    return response.data;
  },

  async updateStock(id: string, quantity_available: number): Promise<ApiResponse<InventoryItem>> {
    const response = await apiClient.patch(`/inventory/v1/inventory/${id}/`, { quantity_available });
    return response.data;
  },

  async createInventory(data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    const response = await apiClient.post('/inventory/v1/inventory/', data);
    return response.data;
  },
};
