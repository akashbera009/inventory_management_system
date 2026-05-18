import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  weight: z.number().min(1, 'weight is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string(),
  is_active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      sku: initialData.sku,
      price: initialData.price,
      description: initialData.description,
      weight: initialData.weight,
      is_active: initialData.is_active,
    } : {
      name: '',
      sku: '',
      weight: 0,
      price: 0,
      description: '',
      is_active: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input id="name" placeholder="e.g. Wireless Mouse" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" placeholder="PROD-001" {...register('sku')} />
          {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
        </div>

      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price ($)</Label>
        <Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
        {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="Product description..." {...register('description')} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="weight">Weight</Label>
        <Input id="weight" type="number" step="0.01" {...register('weight', { valueAsNumber: true })} />
        {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="is_active">Is Active</Label>
        <Input id="is_active" type="checkbox" {...register('is_active')} />
        {errors.is_active && <p className="text-sm text-destructive">{errors.is_active.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Product'}
      </Button>
    </form>
  );
}
