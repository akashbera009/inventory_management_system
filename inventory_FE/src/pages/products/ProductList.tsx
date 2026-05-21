import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { productService } from '@/features/products/services/productService';
import { ProductForm } from '@/features/products/components/ProductForm';
import { Product } from '@/types';

export function ProductList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, search }],
    queryFn: () => productService.getProducts({ page, search }),
  });
  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProduct(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const products = data?.data || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages || 0
  const pageSize = data?.page_size || 0

  const columns = [
    { header: 'Name', accessor: (p: Product) => p.name },
    { header: 'SKU', accessor: (p: Product) => <span className="font-mono text-xs">{p.sku}</span> },
    { header: 'Category', accessor: (p: Product) => p.category },
    { header: 'Price', accessor: (p: Product) => `$${Number(p.price).toFixed(2)}` },
    {
      header: 'Actions',
      accessor: (p: Product) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(p)}>
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                deleteMutation.mutate(p.id);
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
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and pricing.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              onSubmit={async (data) => {
                await createMutation.mutateAsync(data);
              }}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        onSearch={setSearch}
        onPageChange={setPage}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              initialData={selectedProduct}
              onSubmit={async (data) => {
                await updateMutation.mutateAsync({ id: selectedProduct.id, data });
              }}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
