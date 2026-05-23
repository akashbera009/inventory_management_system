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
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
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
    defaultValues: initialData
      ? {
          name: initialData.name,
          city: initialData.city,
          state: initialData.state,
          capacity: initialData.capacity,
          latitude: initialData.latitude != null ? Number(initialData.latitude) : undefined,
          longitude: initialData.longitude != null ? Number(initialData.longitude) : undefined,
        }
      : { name: '', city: '', state: '', capacity: 0, latitude: undefined, longitude: undefined },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Warehouse Name</Label>
        <Input id="name" placeholder="Main Distribution Center" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" placeholder="New York" {...register('city')} />
        {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input id="state" placeholder="New York" {...register('state')} />
        {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity (Units)</Label>
        <Input id="capacity" type="number" {...register('capacity', { valueAsNumber: true })} />
        {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            placeholder="e.g. 40.7128"
            {...register('latitude', { valueAsNumber: true })}
          />
          {errors.latitude && <p className="text-sm text-destructive">{errors.latitude.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            placeholder="e.g. -74.0060"
            {...register('longitude', { valueAsNumber: true })}
          />
          {errors.longitude && <p className="text-sm text-destructive">{errors.longitude.message}</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Latitude and longitude are optional. They're used to display the warehouse on the map.
      </p>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Warehouse'}
      </Button>
    </form>
  );
}
