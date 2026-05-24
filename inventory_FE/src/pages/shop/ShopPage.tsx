import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Plus, Minus, Trash2, Search, ShoppingBag,
  CreditCard, Lock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { productService } from '@/features/products/services/productService';
import { orderService } from '@/features/orders/services/orderService';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import { Product } from '@/types';

/* ─── Constants ─────────────────────────────────────────────── */

const SHOP_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Clothing', value: 'Clothing' },
  { label: 'Food & Beverage', value: 'Food & Beverage' },
  { label: 'Home & Garden', value: 'Home & Garden' },
];

/* ─── Payment helpers ────────────────────────────────────────── */

function fmtCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/* ─── Confirm Dialog ─────────────────────────────────────────── */

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({ open, onCancel, onConfirm }: ConfirmDialogProps) {
  const { items, total, itemCount } = useCartStore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart size={18} />
            Confirm Your Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            You're about to place an order for{' '}
            <span className="font-semibold text-foreground">{itemCount()}</span>{' '}
            {itemCount() === 1 ? 'item' : 'items'}. Please review:
          </p>

          <div className="border border-border rounded-lg divide-y divide-border max-h-52 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} × ${item.price.toFixed(2)}</p>
                </div>
                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center py-2 px-4 bg-muted/40 rounded-lg">
            <span className="text-sm font-medium">Order Total</span>
            <span className="text-xl font-bold text-primary">${total().toFixed(2)}</span>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={onConfirm}>
              <CreditCard size={15} />
              Continue to Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Payment Modal ──────────────────────────────────────────── */

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPay: () => void;
  isPending: boolean;
}

function PaymentModal({ open, onClose, onPay, isPending }: PaymentModalProps) {
  const { total } = useCartStore();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const isValid =
    cardNumber.replace(/\s/g, '').length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cardName.trim().length >= 2;

  const reset = () => {
    setCardNumber(''); setExpiry(''); setCvv(''); setCardName('');
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            Secure Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Amount banner */}
          <div className="flex items-center justify-between bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground font-medium">Amount to Pay</span>
            <span className="text-2xl font-bold text-primary">${total().toFixed(2)}</span>
          </div>

          {/* Card number */}
          <div className="space-y-1.5">
            <Label htmlFor="card-number">Card Number</Label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="card-number"
                className="pl-9 font-mono tracking-widest"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(fmtCard(e.target.value))}
                maxLength={19}
              />
            </div>
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                maxLength={5}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="card-name">Name on Card</Label>
            <Input
              id="card-name"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>

          {/* Dummy security note */}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock size={11} />
            This is a demo payment — no real charges will be made.
          </p>

          <Button
            className="w-full gap-2 text-base h-11"
            disabled={!isValid || isPending}
            onClick={onPay}
          >
            {isPending ? (
              <>Processing…</>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Pay ${total().toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main ShopPage ──────────────────────────────────────────── */

export function ShopPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const { items, addItem, removeItem, updateQuantity, clearCart, itemCount, total } = useCartStore();

  /* ── Infinite query ──────────────────────────────────────── */
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['shop-products', { search, category: activeCategory }],
    queryFn: ({ pageParam }) =>
      productService.getProducts({
        search: search || undefined,
        category: activeCategory || undefined,
        is_active: 'true',
        in_stock: 'true',
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      const total = lastPage.total_pages ?? 1;
      return (lastPageParam as number) < total ? (lastPageParam as number) + 1 : undefined;
    },
  });

  const products: Product[] = infiniteData?.pages.flatMap((p) => p.data) ?? [];

  /* ── IntersectionObserver for infinite scroll ─────────────── */
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '120px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  /* ── Order mutation ──────────────────────────────────────── */
  const placeMutation = useMutation({
    mutationFn: () =>
      orderService.createOrder({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      }),
    onSuccess: () => {
      clearCart();
      setShowPayment(false);
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast.success('Order placed successfully! Check your notifications for updates.');
    },
    onError: (err: any) => {
      setShowPayment(false);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Failed to place order. Please try again.';
      toast.error(msg);
    },
  });

  /* ── Handlers ────────────────────────────────────────────── */
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="flex gap-6 h-full">

      {/* ── Products area ─────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
          <p className="text-muted-foreground">Browse available products and add them to your cart.</p>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {SHOP_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <ShoppingBag size={48} strokeWidth={1.2} />
            <p className="text-sm">No available products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((product) => {
              const inCart = items.find((i) => i.product_id === Number(product.id));
              const stock = product.total_stock ?? 0;

              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
                    {product.category && (
                      <span className="text-xs text-muted-foreground">{product.category}</span>
                    )}
                  </div>

                  <p className="text-lg font-bold text-primary">${Number(product.price).toFixed(2)}</p>

                  <p className="text-xs text-muted-foreground">
                    {stock} unit{stock !== 1 ? 's' : ''} left
                  </p>

                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(inCart.product_id, inCart.quantity - 1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="text-sm font-semibold w-8 text-center">{inCart.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={inCart.quantity >= stock}
                        onClick={() => updateQuantity(inCart.product_id, inCart.quantity + 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full gap-1"
                      onClick={() =>
                        addItem({
                          product_id: Number(product.id),
                          name: product.name,
                          price: Number(product.price),
                          category: product.category || '',
                          total_stock: stock,
                        })
                      }
                    >
                      <ShoppingCart size={14} />
                      Add to Cart
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          )}
          {!hasNextPage && products.length > 0 && (
            <p className="text-xs text-muted-foreground">All products loaded</p>
          )}
        </div>
      </div>

      {/* ── Cart panel ────────────────────────────────────── */}
      <div className="w-80 shrink-0">
        <div className="sticky top-0 rounded-xl border border-border bg-card shadow-sm flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
          {/* Cart header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2 font-semibold">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {itemCount() > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {itemCount()}
                </span>
              )}
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={clearCart}
              >
                Clear
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3 text-muted-foreground px-4">
              <ShoppingCart size={36} strokeWidth={1.2} />
              <p className="text-sm text-center">Your cart is empty. Add products to get started.</p>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeItem(item.product_id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Cart footer */}
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-bold">${total().toFixed(2)}</span>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => setShowConfirm(true)}
                >
                  <ShoppingBag size={15} />
                  Place Order
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Dialogs ───────────────────────────────────────── */}
      <ConfirmDialog
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          setShowPayment(true);
        }}
      />

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onPay={() => placeMutation.mutate()}
        isPending={placeMutation.isPending}
      />
    </div>
  );
}
