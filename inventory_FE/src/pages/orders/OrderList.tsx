import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { orderService } from '@/features/orders/services/orderService';
import { useAuthStore } from '@/store/authStore';
import { Order } from '@/types';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

function extractErrorMessage(error: unknown): string {
  const data = (error as any)?.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  if (typeof data === 'object') {
    for (const key of ['detail', 'message', 'non_field_errors', 'status', 'error']) {
      const val = data[key];
      if (Array.isArray(val) && val.length) return val[0];
      if (typeof val === 'string') return val;
    }
    const firstVal = Object.values(data)[0];
    if (Array.isArray(firstVal) && firstVal.length) return String(firstVal[0]);
    if (typeof firstVal === 'string') return firstVal;
  }
  return String(data);
}

const CATEGORY_PILLS = [
  { label: 'All', value: '' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Clothing', value: 'Clothing' },
  { label: 'Food & Beverage', value: 'Food & Beverage' },
  { label: 'Home & Garden', value: 'Home & Garden' },
];

export function OrderList() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isBuyer = user?.role === 'BUYER';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { page, search, status: filterStatus, category: filterCategory }],
    queryFn: () =>
      orderService.getOrders({ page, search, status: filterStatus, category: filterCategory }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => orderService.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
      setEditStatus('');
      setUpdateError(null);
      toast.success('Order status updated successfully!');
    },
    onError: (error) => {
      setUpdateError(extractErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: orderService.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted.');
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: orderService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully.');
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const orders = data?.data || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages;
  const pageSize = data?.page_size || 0;

  /* ── Role-aware column definitions ─────────────────────── */

  // Shared columns
  const colOrderNum = {
    header: 'Order #',
    accessor: (o: Order) => (
      <span className="font-mono text-xs">{o.order_number || o.id}</span>
    ),
  };

  const colCustomer = {
    header: 'Customer',
    accessor: (o: Order) => o.user || '—',
  };

  const colTotal = {
    header: 'Total',
    accessor: (o: Order) => `$${Number(o.total_price).toFixed(2)}`,
  };

  const colStatus = {
    header: 'Status',
    accessor: (o: Order) => <StatusBadge status={o.status} />,
  };

  const colPlacedAt = {
    header: 'Placed At (IST)',
    accessor: (o: Order) => {
      if (!o.created_at) return '—';
      try {
        const date = new Date(o.created_at);
        return date.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      } catch (e) {
        return '—';
      }
    },
  };

  // Admin / Manager: edit status + delete
  const colAdminActions = {
    header: 'Actions',
    accessor: (o: Order) => (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          title="Update status"
          onClick={() => { setSelectedOrder(o); setEditStatus(o.status || ''); }}
        >
          <Edit2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          title="Delete"
          onClick={() => {
            if (confirm(`Delete order ${o.order_number || o.id}?`)) {
              deleteMutation.mutate(o.id);
            }
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    ),
  };

  // Buyer: cancel if pending
  const colBuyerActions = {
    header: 'Actions',
    accessor: (o: Order) => {
      const isPending = o.status?.toLowerCase() === 'pending';
      if (!isPending) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:bg-destructive/10"
          disabled={cancelMutation.isPending}
          onClick={() => {
            if (confirm('Are you sure you want to cancel this order?')) {
              cancelMutation.mutate(o.id);
            }
          }}
        >
          <XCircle size={14} />
          Cancel
        </Button>
      );
    },
  };

  const columns = isManagerOrAdmin
    ? [colOrderNum, colCustomer, colTotal, colPlacedAt, colStatus, colAdminActions]
    : isBuyer
    ? [colOrderNum, colTotal, colPlacedAt, colStatus, colBuyerActions]
    : [colOrderNum, colCustomer, colTotal, colPlacedAt, colStatus]; // STAFF: read-only

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          {isBuyer ? 'View your orders and cancel pending ones.' : 'Track and manage customer orders.'}
        </p>
      </div>

      {/* Category pill filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_PILLS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setFilterCategory(cat.value); setPage(1); }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
                filterCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-3">
          <select
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          {(filterStatus || filterCategory) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { setFilterStatus(''); setFilterCategory(''); setPage(1); }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        isLoading={isLoading}
        onSearch={setSearch}
        onPageChange={setPage}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      {/* Update status dialog — MANAGER / ADMIN only */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) { setSelectedOrder(null); setEditStatus(''); setUpdateError(null); }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Order{' '}
              <span className="font-medium text-foreground font-mono">
                {selectedOrder?.order_number || selectedOrder?.id}
              </span>
            </p>
            <div className="space-y-2">
              <Label>New Status</Label>
              <select
                className="w-full p-2 rounded-md border border-border bg-background text-sm"
                value={editStatus}
                onChange={(e) => { setEditStatus(e.target.value); setUpdateError(null); }}
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            {updateError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => {
                if (!selectedOrder || !editStatus) return;
                updateMutation.mutate({ id: selectedOrder.id, data: { status: editStatus } });
              }}
              disabled={updateMutation.isPending || !editStatus}
            >
              {updateMutation.isPending ? 'Updating…' : 'Update Status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
