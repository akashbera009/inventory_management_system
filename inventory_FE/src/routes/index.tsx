import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { ProductList } from '@/pages/products/ProductList';
import { WarehouseList } from '@/pages/warehouses/WarehouseList';
import { InventoryList } from '@/pages/inventory/InventoryList';
import { OrderList } from '@/pages/orders/OrderList';
import { NotificationList } from '@/pages/notifications/NotificationList';
import { AuditLogList } from '@/pages/auditLogs/AuditLogList';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { RoleRoute } from '@/components/common/RoleRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/products',
        element: <ProductList />,
      },
      {
        path: '/warehouses',
        element: <WarehouseList />,
      },
      {
        path: '/inventory',
        element: <InventoryList />,
      },
      {
        path: '/orders',
        element: <OrderList />,
      },
      {
        path: '/notifications',
        element: <NotificationList />,
      },
      {
        path: '/audit-logs',
        element: (
          <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <AuditLogList />
          </RoleRoute>
        ),
      },
      {
        path: '/admin',

        element: (
          <RoleRoute allowedRoles={['ADMIN']}>
            <div className="p-4">Admin Only Page</div>
          </RoleRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
