import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse } from '@/types';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  initialData?: Warehouse;
  onSubmit: (data: WarehouseFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function WarehouseForm({ initialData, onSubmit, isLoading }: WarehouseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      location: initialData.location,
      capacity: initialData.capacity,
    } : {
      name: '',
      location: '',
      capacity: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Warehouse Name</Label>
        <Input id="name" placeholder="Main Distribution Center" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="New York, NY" {...register('location')} />
        {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity (Units)</Label>
        <Input id="capacity" type="number" {...register('capacity', { valueAsNumber: true })} />
        {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Warehouse'}
      </Button>
    </form>
  );
}
