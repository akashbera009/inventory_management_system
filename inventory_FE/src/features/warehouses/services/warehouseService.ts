import apiClient from '@/api/axios';
import { Warehouse, ApiResponse, PaginatedResponse } from '@/types';

export const warehouseService = {
  async getWarehouses(): Promise<PaginatedResponse<Warehouse>> {
    const response = await apiClient.get('/warehouses/v1/warehouses/');
    return response.data;
  },

  async getWarehouse(id: string): Promise<ApiResponse<Warehouse>> {
    const response = await apiClient.get(`/warehouses/v1/warehouses/${id}/`);
    return response.data;
  },

  async createWarehouse(data: Partial<Warehouse>): Promise<ApiResponse<Warehouse>> {
    const response = await apiClient.post('/warehouses/v1/warehouses/', data);
    return response.data;
  },

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<ApiResponse<Warehouse>> {
    const response = await apiClient.patch(`/warehouses/v1/warehouses/${id}/`, data);
    return response.data;
  },

  async deleteWarehouse(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/warehouses/v1/warehouses/${id}/`);
    return response.data;
  },
};
