export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'BUYER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  weight: number;
  category?: string;
  is_active: boolean;
  total_stock?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_active?: boolean;
}

export interface InventoryItem {
  id: string;
  product: string | Product;
  warehouse: string | Warehouse;
  product_details?: Product;
  warehouse_details?: Warehouse;
  quantity_available: number;
  reserved_quantity: number;
  updated_at?: string;
  // legacy aliases kept for compatibility
  quantity?: number;
  lowStockThreshold?: number;
  lastUpdated?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  order_number?: string;
  user?: string;
  items?: OrderItem[];
  total_price?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  // legacy
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  order: string | number;
  old_status: string;
  new_status: string;
  changed_at: string;
  // legacy fields
  user?: User;
  action?: string;
  entity?: string;
  entityId?: string;
  timestamp?: string;
  details?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
  token?: string;
  role?: string;
}

/** Matches the backend LargeResultsSetPagination response shape */
export interface PaginatedResponse<T> {
  data: T[];
  total_items?: number;
  total_count?: number;
  total_pages?: number;
  page_size?: number;
  message?: string;
}
