import React from 'react';
import { ShoppingCart, Warehouse, Bell, DollarSign, AlertTriangle, PackageCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell,
} from 'recharts';

import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { notificationService } from '@/features/notifications/services/notificationService';
import { inventoryService } from '@/features/inventory/services/inventoryService';
import { dashboardService } from '@/features/dashboard/services/dashboardService';

import { useAuthStore } from '@/store/authStore';

const LOW_STOCK_THRESHOLD = 10;

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Confirmed: '#10b981',
  Completed: '#3b82f6',
  Cancelled: '#ef4444',
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const color = STATUS_COLORS[label as string] ?? '#6b7280';
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold mb-1" style={{ color }}>{label}</p>
      <p className="text-foreground">
        {payload[0].value} order{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER';

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: notificationService.getNotifications,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: () => inventoryService.getInventory({ page: 1 }),
    enabled: isAdminOrManager,
  });

  const stats = statsData?.data;
  const notifications = notificationsData?.data || [];
  const inventory = inventoryData?.data || [];

  const lowStockItems = inventory.filter(
    (item: any) => (item.quantity_available ?? 0) <= LOW_STOCK_THRESHOLD
  );

  const revenue = parseFloat(stats?.total_revenue ?? '0');

  const statCards = [
    {
      title: 'Active Orders',
      value: stats?.active_orders ?? '—',
      icon: ShoppingCart,
      description: 'Currently processing',
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
      variant: 'blue' as const,
    },
    {
      title: 'Low Stock Items',
      value: stats?.low_stock_count ?? '—',
      icon: Bell,
      description: 'Items below threshold',
      roles: ['ADMIN', 'MANAGER'],
      variant: 'rose' as const,
    },
    {
      title: 'Revenue',
      value: `₹${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'From completed orders',
      roles: ['ADMIN', 'MANAGER'],
      variant: 'emerald' as const,
    },
    {
      title: 'Warehouses',
      value: stats?.warehouse_count ?? '—',
      icon: Warehouse,
      description: 'Storage locations',
      roles: ['ADMIN', 'MANAGER'],
      variant: 'amber' as const,
    },
  ].filter((item) => item.roles.includes(role || 'STAFF'));

  const statusCounts = stats?.order_status_counts;
  const chartData = [
    { name: 'Pending', orders: statusCounts?.pending ?? 0 },
    { name: 'Confirmed', orders: statusCounts?.confirmed ?? 0 },
    { name: 'Completed', orders: statusCounts?.completed ?? 0 },
    { name: 'Cancelled', orders: statusCounts?.cancelled ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Welcome back to your inventory control center.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {isAdminOrManager && (
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Orders Overview</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={32}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                    <Bar dataKey="orders" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name]}
                          fillOpacity={0.9}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-3">
                {chartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: STATUS_COLORS[entry.name] }}
                    />
                    {entry.name}
                    <span className="font-semibold text-foreground">{entry.orders}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={isAdminOrManager ? 'col-span-3' : 'col-span-7'}>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications found.</p>
            ) : (
              notifications.slice(0, 5).map((notif: any) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="p-2 bg-background rounded-full">
                    <Bell size={14} className="text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{notif.message}</p>
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

      {/* Low Stock Items list — ADMIN/MANAGER only */}
      {isAdminOrManager && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            {lowStockItems.length !== 0 ?
              <AlertTriangle size={18} className='text-destructive' /> :
              <PackageCheck size={18} className='text-emerald-600' />
            }
            <CardTitle>{lowStockItems.length !== 0 ? 'Low Stock Items' : 'Sufficient Stock'}</CardTitle>
            <span className="ml-auto text-xs text-muted-foreground">
              threshold ≤ {LOW_STOCK_THRESHOLD} units
            </span>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are sufficiently stocked.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs">
                      <th className="text-left py-2 pr-4 font-medium">Product</th>
                      <th className="text-left py-2 pr-4 font-medium">Warehouse</th>
                      <th className="text-right py-2 font-medium">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item: any) => (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4 font-medium">
                          {item.product_details?.name ?? '—'}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {item.warehouse_details?.name ?? '—'}
                        </td>
                        <td className="py-2 text-right">
                          <span className="text-destructive font-semibold">
                            {item.quantity_available}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
