'use client';

import { create } from 'zustand';
import { WindowState } from '@/types/window';
import { getApp } from '@/services/appRegistry';
import { v4 as uuidv4 } from 'uuid';

let nextZIndex = 10;

interface WindowStore {
  windows: WindowState[];
  activeWindowId: string | null;

  openWindow: (appId: string, options?: { title?: string; openFilePath?: string }) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  updateWindowBounds: (id: string, x: number, y: number, width: number, height: number) => void;
  setWindowTitle: (id: string, title: string) => void;
  minimizeAll: () => void;
  closeAll: () => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindowId: null,

  openWindow: (appId: string, options?: { title?: string; openFilePath?: string }) => {
    const app = getApp(appId);
    if (!app) return '';

    // Check singleton
    if (app.singleton) {
      const existing = get().windows.find(w => w.appId === appId);
      if (existing) {
        get().focusWindow(existing.id);
        if (existing.isMinimized) {
          get().restoreWindow(existing.id);
        }
        return existing.id;
      }
    }

    const id = uuidv4();
    const windowCount = get().windows.length;
    const cascade = windowCount * 30;

    const newWindow: WindowState = {
      id,
      appId,
      title: options?.title || app.name,
      icon: app.icon,
      x: 100 + (cascade % 300),
      y: 60 + (cascade % 200),
      width: app.defaultWidth,
      height: app.defaultHeight,
      minWidth: app.minWidth,
      minHeight: app.minHeight,
      isMinimized: false,
      isMaximized: false,
      zIndex: ++nextZIndex,
      isActive: true,
      openFilePath: options?.openFilePath,
    };

    set(state => ({
      windows: [...state.windows.map(w => ({ ...w, isActive: false })), newWindow],
      activeWindowId: id,
    }));

    return id;
  },

  closeWindow: (id: string) => {
    set(state => {
      const remaining = state.windows.filter(w => w.id !== id);
      const newActive = remaining.length > 0
        ? remaining.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
        : null;
      return {
        windows: remaining.map(w => ({ ...w, isActive: w.id === newActive })),
        activeWindowId: newActive,
      };
    });
  },

  focusWindow: (id: string) => {
    set(state => ({
      windows: state.windows.map(w => ({
        ...w,
        zIndex: w.id === id ? ++nextZIndex : w.zIndex,
        isActive: w.id === id,
      })),
      activeWindowId: id,
    }));
  },

  minimizeWindow: (id: string) => {
    set(state => {
      const remaining = state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: true, isActive: false } : w
      );
      const visible = remaining.filter(w => !w.isMinimized);
      const newActive = visible.length > 0
        ? visible.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
        : null;
      return {
        windows: remaining.map(w => ({ ...w, isActive: w.id === newActive })),
        activeWindowId: newActive,
      };
    });
  },

  maximizeWindow: (id: string) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id
          ? {
              ...w,
              isMaximized: true,
              prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
              x: 0,
              y: 0,
              width: typeof window !== 'undefined' ? window.innerWidth : 1920,
              height: typeof window !== 'undefined' ? window.innerHeight - 48 : 1032,
            }
          : w
      ),
    }));
  },

  restoreWindow: (id: string) => {
    set(state => ({
      windows: state.windows.map(w => {
        if (w.id !== id) return w;
        if (w.isMinimized) {
          return { ...w, isMinimized: false, isActive: true, zIndex: ++nextZIndex };
        }
        if (w.isMaximized && w.prevBounds) {
          return { ...w, isMaximized: false, ...w.prevBounds };
        }
        return w;
      }),
      activeWindowId: id,
    }));
    get().focusWindow(id);
  },

  toggleMaximize: (id: string) => {
    const win = get().windows.find(w => w.id === id);
    if (!win) return;
    if (win.isMaximized) {
      get().restoreWindow(id);
    } else {
      get().maximizeWindow(id);
    }
  },

  updateWindowPosition: (id: string, x: number, y: number) => {
    set(state => ({
      windows: state.windows.map(w => w.id === id ? { ...w, x, y } : w),
    }));
  },

  updateWindowSize: (id: string, width: number, height: number) => {
    set(state => ({
      windows: state.windows.map(w => w.id === id ? { ...w, width, height } : w),
    }));
  },

  updateWindowBounds: (id: string, x: number, y: number, width: number, height: number) => {
    set(state => ({
      windows: state.windows.map(w => w.id === id ? { ...w, x, y, width, height } : w),
    }));
  },

  setWindowTitle: (id: string, title: string) => {
    set(state => ({
      windows: state.windows.map(w => w.id === id ? { ...w, title } : w),
    }));
  },

  minimizeAll: () => {
    set(state => ({
      windows: state.windows.map(w => ({ ...w, isMinimized: true, isActive: false })),
      activeWindowId: null,
    }));
  },

  closeAll: () => {
    set({ windows: [], activeWindowId: null });
  },
}));
