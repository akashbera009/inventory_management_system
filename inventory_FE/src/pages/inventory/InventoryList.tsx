import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Warehouse as WarehouseIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { inventoryService } from '@/features/inventory/services/inventoryService';
import { productService } from '@/features/products/services/productService';
import { warehouseService } from '@/features/warehouses/services/warehouseService';
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

  // Add stock form state
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('0');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', { page, search }],
    queryFn: () => inventoryService.getInventory({ page, search }),
  });

  // Query products and warehouses for dropdown selects
  const { data: productsData } = useQuery({
    queryKey: ['products-for-select'],
    queryFn: () => productService.getProducts({ page: 1 }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-for-select'],
    queryFn: () => warehouseService.getWarehouses(),
  });

  const productList = productsData?.data || [];
  const warehouseList = warehousesData?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity_available }: { id: string; quantity_available: number }) =>
      inventoryService.updateStock(id, quantity_available),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItem(null);
      toast.success('Stock level updated successfully!');
    },
    onError: () => toast.error('Failed to update stock.'),
  });

  const createMutation = useMutation({
    mutationFn: inventoryService.createInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsCreateOpen(false);
      setProductId('');
      setWarehouseId('');
      setQuantity('0');
      toast.success('Inventory added successfully!');
    },
    onError: () => toast.error('Failed to add inventory.'),
  });

  const inventory = data?.data || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages || 0;
  const pageSize = data?.page_size || 0;

  // Engagement stats derived from current page data
  const distinctProducts = new Set(inventory.map((item: any) => item.product_details?.id ?? item.product)).size;
  const distinctWarehouses = new Set(inventory.map((item: any) => item.warehouse_details?.id ?? item.warehouse)).size;

  const columns = [
    { header: 'Product', accessor: (item: InventoryItem) => item.product_details?.name },
    { header: 'Warehouse', accessor: (item: InventoryItem) => item.warehouse_details?.name },
    {
      header: 'Available',
      accessor: (item: InventoryItem) => (
        <span className={item.quantity_available <= 10 ? 'text-destructive font-semibold' : ''}>
          {item.quantity_available}
        </span>
      ),
    },
    {
      header: 'Reserved',
      accessor: (item: InventoryItem) => item.reserved_quantity,
    },
    {
      header: 'Actions',
      accessor: (item: InventoryItem) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
          Adjust Stock
        </Button>
      ),
    },
  ];

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
                <Label htmlFor="product-select">Product</Label>
                <select
                  id="product-select"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select a Product</option>
                  {productList.map((prod: any) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-select">Warehouse</Label>
                <select
                  id="warehouse-select"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  <option value="">Select a Warehouse</option>
                  {warehouseList.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity-input">Quantity</Label>
                <Input
                  id="quantity-input"
                  type="number"
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!productId || !warehouseId) {
                    alert('Please select both a product and a warehouse.');
                    return;
                  }
                  createMutation.mutate({
                    product: productId,
                    warehouse: warehouseId,
                    quantity_available: parseInt(quantity) || 0,
                  });
                }}
                disabled={createMutation.isPending || !productId || !warehouseId}
              >
                {createMutation.isPending ? 'Saving...' : 'Add Inventory'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Engagement cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products in Stock</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Package size={18} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? '—' : totalItems > pageSize ? `${distinctProducts}+` : distinctProducts}</p>
            <p className="text-xs text-muted-foreground mt-1">Unique products tracked on this page</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Warehouses</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <WarehouseIcon size={18} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? '—' : distinctWarehouses}</p>
            <p className="text-xs text-muted-foreground mt-1">Warehouses with active inventory</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={inventory}
        columns={columns}
        isLoading={isLoading}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setUpdateQuantity(''); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Updating stock for{' '}
              <span className="font-medium text-foreground">
                {selectedItem?.product_details?.name}
              </span>{' '}
              in {selectedItem?.warehouse_details?.name}.
            </p>
            <div className="space-y-2">
              <Label>New Quantity Available</Label>
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
                  updateMutation.mutate({
                    id: selectedItem.id,
                    quantity_available: parseInt(updateQuantity),
                  });
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
