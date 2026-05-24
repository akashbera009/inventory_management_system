import React, { useEffect, useRef } from 'react';
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
  category: z.string().optional(),
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      sku: initialData.sku,
      category: initialData.category || '',
      price: initialData.price,
      description: initialData.description,
      weight: initialData.weight,
      is_active: initialData.is_active,
    } : {
      name: '',
      sku: '',
      category: '',
      weight: 0,
      price: 0,
      description: '',
      is_active: true, // <-- By default active!
    },
  });

  const productName = watch('name');
  const isSkuTouched = useRef(false);

  useEffect(() => {
    // Only generate if we are in "Create" mode (no initialData) and the user hasn't edited the SKU manually
    if (!initialData && productName && !isSkuTouched.current) {
      // 1. Get uppercase prefix from first 3 alphanumeric letters of product name (fallback to 'PRD')
      const cleanName = productName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      const prefix = cleanName.substring(0, 3) || 'PRD';
      
      // 2. Generate a random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      
      // 3. Format as PREFIX-1234
      const generatedSku = `${prefix}-${randomNum}`;
      
      setValue('sku', generatedSku, { shouldValidate: true });
    }
  }, [productName, setValue, initialData]);

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
          <Input 
            id="sku" 
            placeholder="PROD-001" 
            {...register('sku', {
              onChange: () => { isSkuTouched.current = true; }
            })} 
          />
          {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register('category')}
          >
            <option value="">Select Category...</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports & Outdoors">Sports & Outdoors</option>
            <option value="Health & Beauty">Health & Beauty</option>
            <option value="Toys & Games">Toys & Games</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Automotive">Automotive</option>
            <option value="Books & Media">Books & Media</option>
          </select>
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
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
      <div className="space-y-2 pt-2">
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input 
            type="checkbox" 
            id="is_active" 
            className="sr-only peer" 
            {...register('is_active')} 
          />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-muted peer-checked:bg-emerald-500"></div>
          <span className="ml-3 text-sm font-medium text-muted-foreground peer-checked:text-foreground">
            Product is Active
          </span>
        </label>
        {errors.is_active && <p className="text-sm text-destructive">{errors.is_active.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Product'}
      </Button>
    </form>
  );
}
