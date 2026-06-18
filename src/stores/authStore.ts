'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  isLocked: boolean;
  username: string;
  avatar: string;

  login: (username: string, password: string) => boolean;
  logout: () => void;
  lock: () => void;
  unlock: (password: string) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLocked: true,
      username: 'User',
      avatar: '',

      login: (username: string, password: string) => {
        // Simulated auth
        if (password === 'password' || password === '') {
          set({ isAuthenticated: true, isLocked: false, username: username || 'User' });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false, isLocked: true });
      },

      lock: () => {
        set({ isLocked: true });
      },

      unlock: (password: string) => {
        if (password === 'password' || password === '') {
          set({ isLocked: false });
          return true;
        }
        return false;
      },
    }),
    { name: 'webos-auth' }
  )
);
