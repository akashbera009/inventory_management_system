import apiClient from '@/api/axios';
import { Product, ApiResponse, PaginatedResponse } from '@/types';

export const productService = {
  async getProducts(params: { page?: number; search?: string; category?: string; is_active?: string; ordering?: string } = {}): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get('/products/v1/products/', { params });
    return response.data;
  },

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(`/products/v1/products/${id}/`);
    return response.data;
  },

  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    const response = await apiClient.post('/products/v1/products/', data);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    const response = await apiClient.patch(`/products/v1/products/${id}/`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/products/v1/products/${id}/`);
    return response.data;
  },
};
