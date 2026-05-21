import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Bell,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    roles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    path: '/products',
    roles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    id: 'warehouses',
    label: 'Warehouses',
    icon: Warehouse,
    path: '/warehouses',
    roles: ['ADMIN', 'MANAGER']
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    path: '/inventory',
    roles: ['ADMIN', 'MANAGER']
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    path: '/orders',
    roles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
    roles: ['STAFF']
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: FileText,
    path: '/audit-logs',
    roles: ['ADMIN']
  },
];

export function DashboardLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    console.log('user', user);
  }, [user])

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="z-20 w-64 h-full bg-card border-r border-border flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xl">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                  <Package size={20} />
                </div>
                <span>InvManager</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X size={20} />
              </Button>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
              {/* {MENU_ITEMS.filter(item => item.roles.includes(user?.role || 'STAFF')).map((item) => ( */}
              {MENU_ITEMS.filter(item => item.roles.includes(user?.role || 'STAFF')).map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className={cn("lg:hidden", !isSidebarOpen && "flex")}
            >
              <Menu size={20} />
            </Button>
            <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
              {MENU_ITEMS.find(item => item.path === location.pathname)?.label || 'Overview'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              <UserIcon size={14} />
              <span>{user?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
              <span className="text-xs font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
