import React from 'react';
import { Package, ShoppingCart, Warehouse, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { productService } from '@/features/products/services/productService';
import { warehouseService } from '@/features/warehouses/services/warehouseService';
import { orderService } from '@/features/orders/services/orderService';
import { notificationService } from '@/features/notifications/services/notificationService';

import { useAuthStore } from '@/store/authStore';


export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  const { data: productsData } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => productService.getProducts({ page: 1 }),
  });

  const { data: warehouseData } = useQuery({
    queryKey: ['dashboard-warehouses'],
    queryFn: warehouseService.getWarehouses,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: () => orderService.getOrders({ page: 1 }),
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: notificationService.getNotifications,
  });

  const products = productsData?.data || [];
  const warehouses = warehouseData?.data || [];
  const orders = ordersData?.data || [];
  const notifications = notificationsData?.data || [];

  const lowStockProducts = products.filter(
    (p: any) => p.stock_quantity <= 10
  );

  const activeOrders = orders.filter(
    (o: any) =>
      o.status === 'pending' ||
      o.status === 'confirmed'
  );

  const stats = [
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      description: 'Available products',
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length,
      icon: Bell,
      description: 'Needs attention',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Active Orders',
      value: activeOrders.length,
      icon: ShoppingCart,
      description: 'Currently processing',
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    {
      title: 'Warehouses',
      value: warehouses.length,
      icon: Warehouse,
      description: 'Storage locations',
      roles: ['ADMIN', 'MANAGER'],
    },
  ].filter((item) => item.roles.includes(role || 'STAFF'));

  const chartData = [
    {
      name: 'Pending',
      orders: orders.filter((o: any) => o.status === 'pending').length,
    },
    {
      name: 'Confirmed',
      orders: orders.filter((o: any) => o.status === 'confirmed').length,
    },
    {
      name: 'Completed',
      orders: orders.filter((o: any) => o.status === 'completed').length,
    },
    {
      name: 'Cancelled',
      orders: orders.filter((o: any) => o.status === 'cancelled').length,
    },
  ];

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Overview
          </h1>

          <p className="text-muted-foreground">
            Welcome back to your inventory control center.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">

        {role !== 'STAFF' && (
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Orders Overview</CardTitle>
            </CardHeader>

            <CardContent className="h-[300px]">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={chartData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="orders"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </CardContent>
          </Card>
        )}


        <Card className={role === 'STAFF' ? 'col-span-7' : 'col-span-3'}>

          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notifications found.
              </p>
            ) : (
              notifications.slice(0, 5).map((notif: any) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="p-2 bg-background rounded-full">
                    <Bell
                      size={14}
                      className="text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {notif.message}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}