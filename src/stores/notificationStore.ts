'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationStore {
  notifications: Notification[];
  showCenter: boolean;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleCenter: () => void;
  setShowCenter: (show: boolean) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  showCenter: false,

  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: uuidv4(),
      timestamp: Date.now(),
      read: false,
    };
    set(state => ({
      notifications: [newNotif, ...state.notifications].slice(0, 50),
    }));
  },

  markRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
    }));
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearAll: () => set({ notifications: [] }),

  toggleCenter: () => set(state => ({ showCenter: !state.showCenter })),
  setShowCenter: (show) => set({ showCenter: show }),

  unreadCount: () => get().notifications.filter(n => !n.read).length,
}));
