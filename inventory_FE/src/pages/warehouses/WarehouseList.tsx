import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { warehouseService } from '@/features/warehouses/services/warehouseService';
import { WarehouseForm } from '@/features/warehouses/components/WarehouseForm';
import { WarehouseMap } from '@/features/warehouses/components/WarehouseMap';
import { Warehouse } from '@/types';

export function WarehouseList() {
  const queryClient = useQueryClient();
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getWarehouses,
  });

  const createMutation = useMutation({
    mutationFn: warehouseService.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      warehouseService.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setSelectedWarehouse(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: warehouseService.deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const warehouses = data?.data || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages || 0;
  const pageSize = data?.page_size || 0;

  const columns = [
    { header: 'Name', accessor: (w: Warehouse) => w.name },
    { header: 'Location', accessor: (w: Warehouse) => `${w.city}, ${w.state}` },
    { header: 'Capacity', accessor: (w: Warehouse) => `${w.capacity} units` },
    {
      header: 'Coordinates',
      accessor: (w: Warehouse) =>
        w.latitude && w.longitude ? (
          <span className="font-mono text-xs text-muted-foreground">
            {Number(w.latitude).toFixed(4)}, {Number(w.longitude).toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: 'Actions',
      accessor: (w: Warehouse) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedWarehouse(w)}>
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${w.name}?`)) {
                deleteMutation.mutate(w.id);
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
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">Manage your storage locations and capacities.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
            </DialogHeader>
            <WarehouseForm
              onSubmit={async (formData) => {
                await createMutation.mutateAsync(formData);
              }}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Dark-themed map */}
      <WarehouseMap warehouses={warehouses} />

      <DataTable
        data={warehouses}
        columns={columns}
        isLoading={isLoading}
        currentPage={1}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      <Dialog open={!!selectedWarehouse} onOpenChange={() => setSelectedWarehouse(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
          </DialogHeader>
          {selectedWarehouse && (
            <WarehouseForm
              initialData={selectedWarehouse}
              onSubmit={async (formData) => {
                await updateMutation.mutateAsync({ id: selectedWarehouse.id, data: formData });
              }}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
