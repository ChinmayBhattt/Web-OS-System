'use client';

import { useEffect, useCallback } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { useAuthStore } from '@/stores/authStore';

export function useKeyboardShortcuts() {
  const { openWindow, closeWindow, activeWindowId, minimizeAll, windows } = useWindowStore();
  const { lock, isAuthenticated, isLocked } = useAuthStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isAuthenticated || isLocked) return;

    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === 'e') {
      e.preventDefault();
      openWindow('file-explorer');
    } else if (isMod && e.key === 't') {
      e.preventDefault();
      openWindow('terminal');
    } else if (isMod && e.key === 'w') {
      e.preventDefault();
      if (activeWindowId) closeWindow(activeWindowId);
    } else if (isMod && e.key === 'l') {
      e.preventDefault();
      lock();
    } else if (isMod && e.key === 'd') {
      e.preventDefault();
      minimizeAll();
    } else if (isMod && e.key === ',') {
      e.preventDefault();
      openWindow('settings');
    } else if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      // Cycle through windows
      const visibleWindows = windows.filter(w => !w.isMinimized);
      if (visibleWindows.length > 1 && activeWindowId) {
        const currentIdx = visibleWindows.findIndex(w => w.id === activeWindowId);
        const nextIdx = (currentIdx + 1) % visibleWindows.length;
        useWindowStore.getState().focusWindow(visibleWindows[nextIdx].id);
      }
    }
  }, [openWindow, closeWindow, activeWindowId, minimizeAll, windows, lock, isAuthenticated, isLocked]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
