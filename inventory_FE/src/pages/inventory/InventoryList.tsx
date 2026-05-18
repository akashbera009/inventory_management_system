import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { inventoryService } from '@/features/inventory/services/inventoryService';
import { InventoryItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InventoryList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [updateQuantity, setUpdateQuantity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', { page, search }],
    queryFn: () => inventoryService.getInventory({ page, search }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => inventoryService.updateStock(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItem(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: inventoryService.createInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsCreateOpen(false);
    },
  });

  const inventory = data?.data || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages || 0;
  const pageSize = data?.page_size || 0

  const columns = [
    { header: 'Product', accessor: (item: InventoryItem) => item.product_details.name },
    { header: 'Warehouse', accessor: (item: InventoryItem) => item.warehouse_details.name },
    // {
    //   header: 'Stock Level',
    //   accessor: (item: InventoryItem) => (
    //     <div className="flex items-center gap-2">
    //       <span className={cn(
    //         "font-bold",
    //         item.quantity <= item.reserved_quantity ? "text-destructive" : "text-foreground"
    //       )}>
    //         {item.quantity}
    //       </span>
    //       {item.quantity <= item.reserved_quantity && (
    //         <AlertTriangle size={14} className="text-destructive" />
    //       )}
    //     </div>
    //   ),
    // },
    { header: 'Stock Level', accessor: (item: InventoryItem) => item?.reserved_quantity },
    { header: 'Threshold', accessor: (item: InventoryItem) => item?.quantity_available },
    {
      header: 'Actions',
      accessor: (item: InventoryItem) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
          Adjust Stock
        </Button>
      ),
    },
  ];

  function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Track and manage stock levels across all warehouses.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Stock to Warehouse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product ID</Label>
                <Input placeholder="Product ID" />
              </div>
              <div className="space-y-2">
                <Label>Warehouse ID</Label>
                <Input placeholder="Warehouse ID" />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" placeholder="100" />
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate({})} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Add Inventory'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={inventory}
        columns={columns}
        isLoading={isLoading}
        onSearch={setSearch}
        onPageChange={setPage}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Updating stock for <span className="font-medium text-foreground">{selectedItem?.product.name}</span> in {selectedItem?.warehouse.name}.
            </p>
            <div className="space-y-2">
              <Label>New Quantity</Label>
              <Input
                type="number"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(e.target.value)}
                placeholder="Enter new quantity"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (selectedItem) {
                  updateMutation.mutate({ id: selectedItem.id, quantity: parseInt(updateQuantity) });
                }
              }}
              disabled={updateMutation.isPending || !updateQuantity}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
