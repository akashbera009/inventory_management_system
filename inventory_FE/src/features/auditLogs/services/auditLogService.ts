import apiClient from '@/api/axios';
import { AuditLog, ApiResponse, PaginatedResponse } from '@/types';

export const auditLogService = {
  async getAuditLogs(params: { page?: number; search?: string } = {}): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get('/audit_logs/v1/audit_logs/', { params });
    return response.data;
  },
};
