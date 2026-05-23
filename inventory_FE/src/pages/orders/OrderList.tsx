import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { orderService } from '@/features/orders/services/orderService';
import { Order } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/StatusBadge';

/** Extract a human-readable message from a DRF error response */
function extractErrorMessage(error: unknown): string {
  const data = (error as any)?.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  // Field-level: { status: ["msg"] }
  if (typeof data === 'object') {
    for (const key of ['detail', 'message', 'non_field_errors', 'status']) {
      const val = data[key];
      if (Array.isArray(val) && val.length) return val[0];
      if (typeof val === 'string') return val;
    }
    // Fallback: first value of any field
    const firstVal = Object.values(data)[0];
    if (Array.isArray(firstVal) && firstVal.length) return String(firstVal[0]);
    if (typeof firstVal === 'string') return firstVal;
  }
  return String(data);
}

export function OrderList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState(''); // Holds status filter for the table list
  const [editStatus, setEditStatus] = useState('');     // Holds selected status inside the update modal
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { page, search, status: filterStatus }],
    queryFn: () => orderService.getOrders({ page, search, status: filterStatus }),
  });

  const createMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => orderService.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
      setEditStatus('');
      setUpdateError(null);
    },
    onError: (error) => {
      setUpdateError(extractErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: orderService.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const orders = data?.data || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages;
  const pageSize = data?.page_size || 0

  const columns = [
    { header: 'Order ID', accessor: (o: Order) => <span className="font-mono text-xs">{o.id}</span> },
    { header: 'Customer', accessor: (o: Order) => o.user },
    { header: 'Total', accessor: (o: Order) => `$${Number(o.total_price).toFixed(2)}` },
    {
      header: 'Status',
      accessor: (o: Order) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Actions',
      accessor: (o: Order) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"
            onClick={() => {
              setSelectedOrder(o);
              setEditStatus(o.status || '');
            }}>
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (confirm(`Are you sure you want to delete order ${o.id}?`)) {
                deleteMutation.mutate(o.id);
              }
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Track and manage customer orders and fulfillment.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Items</Label>
                <div className="flex gap-2">
                  <Input placeholder="Product ID" />
                  <Input type="number" placeholder="Qty" className="w-20" />
                  <Button variant="outline" size="sm"><Plus size={14} /></Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate({})} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Place Order'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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

      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setEditStatus('');
            setUpdateError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Update status for Order <span className="font-medium text-foreground">{selectedOrder?.id}</span>.
            </p>
            <div className="space-y-2">
              <Label>Order Status</Label>
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
                updateMutation.mutate({
                  id: selectedOrder.id,
                  data: { status: editStatus },
                });
              }}
              disabled={updateMutation.isPending || !editStatus}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
