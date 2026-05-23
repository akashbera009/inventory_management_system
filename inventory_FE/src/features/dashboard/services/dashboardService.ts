import apiClient from '@/api/axios';

export interface DashboardStats {
  active_orders: number;
  order_status_counts: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  total_revenue?: string;
  low_stock_count?: number;
  warehouse_count?: number;
}

export const dashboardService = {
  async getStats(): Promise<{ data: DashboardStats }> {
    const response = await apiClient.get('/dashboard/v1/stats/');
    return response.data;
  },
};
