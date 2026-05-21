import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { auditLogService } from '@/features/auditLogs/services/auditLogService';
import { AuditLog } from '@/types';

export function AuditLogList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, search }],
    queryFn: () => auditLogService.getAuditLogs({ page, search }),
  });

  const logs = data?.data || [];
  const totalItems = data?.total_count || 0;
  const totalPages = data?.total_pages;

  const columns = [
    { header: 'ID', accessor: (log: AuditLog) => log.id },
    { header: 'Order ID', accessor: (log: AuditLog) => log.order },
    { header: 'Old Status', accessor: (log: AuditLog) => log.old_status },
    { header: 'New Status', accessor: (log: AuditLog) => log.new_status },
    { header: 'Timestamp', accessor: (log: AuditLog) => new Date(log.changed_at).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Comprehensive record of all system activities.</p>
        </div>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        isLoading={isLoading}
        onSearch={setSearch}
        onPageChange={setPage}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
      />
    </div>
  );
}
