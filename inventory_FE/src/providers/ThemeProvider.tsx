import React, { useEffect } from 'react';
import { ReactNode } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (targetTheme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(targetTheme);
    };

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Apply role-based coloring class
    root.classList.remove('role-admin', 'role-manager', 'role-staff', 'role-buyer');
    if (role) {
      root.classList.add(`role-${role.toLowerCase()}`);
    } else {
      root.classList.add('role-buyer'); // default fallback
    }
  }, [role]);

  return <>{children}</>;
}
