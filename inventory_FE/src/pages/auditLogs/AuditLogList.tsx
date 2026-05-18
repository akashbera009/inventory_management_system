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

  const logs = data?.data?.results || [];
  const totalItems = data?.data?.count || 0;
  const totalPages = data?.data ? Math.ceil(totalItems / 10) : 0;

  const columns = [
    { header: 'User', accessor: (log: AuditLog) => log.user.username },
    { header: 'Action', accessor: (log: AuditLog) => (
      <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium">
        {log.action}
      </span>
    )},
    { header: 'Entity', accessor: (log: AuditLog) => log.entity },
    { header: 'Timestamp', accessor: (log: AuditLog) => new Date(log.timestamp).toLocaleString() },
    { header: 'Details', accessor: (log: AuditLog) => log.details },
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
