export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

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
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
}

export interface InventoryItem {
  id: string;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
  lowStockThreshold: number;
  lastUpdated: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
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
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user: User;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}
