import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit2, Package } from 'lucide-react';
import { Product } from '@/types';

interface ProductViewDialogProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export function ProductViewDialog({ product, onClose, onEdit }: ProductViewDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package size={18} />
            Product Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                product.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
          </div>

          <div>
            <p className="text-xl font-semibold">{product.name}</p>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-lg font-bold">${Number(product.price).toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="text-lg font-bold">{product.weight} kg</p>
            </div>
          </div>

          {product.category && (
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-medium">{product.category}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            {product.created_at && (
              <div>
                <p>Created</p>
                <p className="text-foreground">{new Date(product.created_at).toLocaleDateString()}</p>
              </div>
            )}
            {product.updated_at && (
              <div>
                <p>Last Updated</p>
                <p className="text-foreground">{new Date(product.updated_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
          >
            <Edit2 size={14} />
            Edit Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
