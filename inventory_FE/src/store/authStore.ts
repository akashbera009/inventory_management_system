import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'BUYER';

interface AuthUser {
  role: AppRole;
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      username: '',
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({
          user,
          username: user.username,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
