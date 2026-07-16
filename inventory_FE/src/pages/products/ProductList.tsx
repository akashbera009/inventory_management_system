import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, SlidersHorizontal, Upload, Search } from 'lucide-react';
import { toast } from 'sonner';

function formatIST(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr)) + ' IST';
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { productService } from '@/features/products/services/productService';
import { ProductForm } from '@/features/products/components/ProductForm';
import { ProductViewDialog } from '@/features/products/components/ProductViewDialog';
import { Product } from '@/types';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

const SORT_OPTIONS = [
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Name (Z-A)', value: '-name' },
  { label: 'Price (Low-High)', value: 'price' },
  { label: 'Price (High-Low)', value: '-price' },
  { label: 'SKU', value: 'sku' },
];

export function ProductList() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canImport = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterIsActive, setFilterIsActive] = useState('');
  const [sortBy, setSortBy] = useState('');

  // CSV import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importJobId, setImportJobId] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, search: debouncedSearch, is_active: filterIsActive, ordering: sortBy }],
    queryFn: () => productService.getProducts({
      page,
      search: debouncedSearch,
      ...(filterIsActive !== '' && { is_active: filterIsActive }),
      ...(sortBy && { ordering: sortBy }),
    }),
  });

  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateOpen(false);
      toast.success('Product added successfully!');
    },
    onError: () => toast.error('Failed to add product.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProduct(null);
      toast.success('Product updated successfully!');
    },
    onError: () => toast.error('Failed to update product.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted.');
    },
    onError: () => toast.error('Failed to delete product.'),
  });

  const products = data?.data || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages || 0;
  const pageSize = data?.page_size || 0;

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/products/v1/products/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const job = res.data?.data;
      setImportJobId(job.id);
      setImportProgress(job);
      setIsImportOpen(true);
      // Poll for status
      pollRef.current = setInterval(async () => {
        const statusRes = await apiClient.get(`/products/v1/products/import/${job.id}/status/`);
        const progress = statusRes.data?.data;
        setImportProgress(progress);
        if (progress.status === 'completed' || progress.status === 'failed') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      }, 2000);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Import failed');
    }
    // Reset file input so same file can be re-uploaded
    e.target.value = '';
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const columns = [
    { header: 'Name', accessor: (p: Product) => p.name },
    { header: 'SKU', accessor: (p: Product) => <span className="font-mono text-xs">{p.sku}</span> },
    { header: 'Category', accessor: (p: Product) => p.category || '—' },
    { header: 'Price', accessor: (p: Product) => `₹${Number(p.price).toFixed(2)}` },
    {
      header: 'Status',
      accessor: (p: Product) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {p.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Created (GMT+5:30)',
      accessor: (p: Product) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatIST(p.created_at)}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (p: Product) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewProduct(p)} title="View">
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(p)} title="Edit">
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            title="Delete"
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
        <div className="flex gap-2">
          {canImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVUpload}
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                Import CSV
              </Button>
            </>
          )}
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
      </div>

      {/* Filter & Sort toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-card">
        <SlidersHorizontal size={16} className="text-muted-foreground" />
        <select
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
          value={filterIsActive}
          onChange={(e) => { setFilterIsActive(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
        >
          <option value="">Sort by…</option>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(filterIsActive || sortBy) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => { setFilterIsActive(''); setSortBy(''); setPage(1); }}
          >
            Clear filters
          </Button>
        )}
        <div className="relative ml-auto w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <DataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        hideSearch={true}
        onPageChange={setPage}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      {/* View dialog */}
      <ProductViewDialog
        product={viewProduct}
        onClose={() => setViewProduct(null)}
        onEdit={(p) => setSelectedProduct(p)}
      />

      {/* CSV Import progress dialog */}
      <Dialog open={isImportOpen} onOpenChange={(open) => { if (!open) { setIsImportOpen(false); setImportProgress(null); setImportJobId(null); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>CSV Import Progress</DialogTitle>
          </DialogHeader>
          {importProgress && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${importProgress.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : importProgress.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                >
                  {importProgress.status}
                </span>
              </div>
              {importProgress.total_rows > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{importProgress.processed_rows} / {importProgress.total_rows}</span>
                  </div>
                  <progress
                    className="w-full h-2 rounded"
                    value={importProgress.processed_rows}
                    max={importProgress.total_rows}
                  />
                </div>
              )}
              {importProgress.errors?.length > 0 && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive max-h-40 overflow-y-auto">
                  <p className="font-semibold mb-1">Errors ({importProgress.errors.length})</p>
                  {importProgress.errors.map((err: any, i: number) => (
                    <p key={i}>Row {err.row}: {err.error}</p>
                  ))}
                </div>
              )}
              {(importProgress.status === 'completed' || importProgress.status === 'failed') && (
                <Button className="w-full" variant="outline" onClick={() => setIsImportOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
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
