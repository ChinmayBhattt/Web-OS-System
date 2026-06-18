'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore, ACCENT_COLORS } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { initializeFileSystem } from '@/services/fileSystem';
import Desktop from '@/components/desktop/Desktop';
import LockScreen from '@/components/auth/LockScreen';

export default function Home() {
  const { mode, accentColor, fontSize } = useThemeStore();
  const { isAuthenticated, isLocked } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [mounted, setMounted] = useState(false);

  useKeyboardShortcuts();

  // Initialize
  useEffect(() => {
    setMounted(true);
    initializeFileSystem();

    // Welcome notification after login
    const timer = setTimeout(() => {
      addNotification({
        title: 'Welcome to WebOS',
        message: 'Your virtual desktop is ready. Explore the apps!',
        icon: '🖥️',
        type: 'info',
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Apply theme
  useEffect(() => {
    if (!mounted) return;

    const resolvedMode = mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

    document.documentElement.setAttribute('data-theme', resolvedMode);

    const accent = ACCENT_COLORS[accentColor];
    document.documentElement.style.setProperty('--accent-h', String(accent.hue));
    document.documentElement.style.setProperty('--accent-s', `${accent.sat}%`);
    document.documentElement.style.setProperty('--accent-l', `${accent.light}%`);
    document.documentElement.style.setProperty('font-size', `${fontSize}px`);
  }, [mode, accentColor, fontSize, mounted]);

  if (!mounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl animate-pulse">🖥️</div>
          <div className="text-sm text-white/50 font-light">Loading WebOS...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <Desktop />
      <LockScreen />
    </main>
  );
}
