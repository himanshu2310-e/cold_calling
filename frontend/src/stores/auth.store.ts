// ============================================
// Auth State Store (Zustand)
// ============================================
import { create } from 'zustand';
import authService from '@/services/auth.service';
import type { IUser } from '@/types';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (payload: any) => Promise<any>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  login: async (payload) => {
    const res = await authService.login(payload);
    const { accessToken, user } = res.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
    }
    set({ user, isAuthenticated: true });
    return user;
  },
  logout: async () => {
    try {
      await authService.logout();
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    set({ user: null, isAuthenticated: false });
  },
  initialize: async () => {
    if (typeof window === 'undefined') {
      set({ isInitialized: true });
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false, user: null });
      return;
    }
    try {
      const res = await authService.getProfile();
      set({ user: res.data, isAuthenticated: true, isInitialized: true });
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));
