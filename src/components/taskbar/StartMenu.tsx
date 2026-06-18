'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useWindowStore } from '@/stores/windowStore';
import { useAuthStore } from '@/stores/authStore';
import { getAllApps } from '@/services/appRegistry';

interface StartMenuProps {
  onClose: () => void;
}

export default function StartMenu({ onClose }: StartMenuProps) {
  const { openWindow } = useWindowStore();
  const { username, logout } = useAuthStore();
  const apps = getAllApps();

  const handleOpenApp = (appId: string) => {
    openWindow(appId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />

      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className="absolute bottom-[56px] left-2 z-[9999] glass-strong rounded-xl overflow-hidden"
        style={{ width: '380px' }}
      >
        {/* User section */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{username}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Local Account</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          >
            <span className="text-sm opacity-50">🔍</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Search apps...</span>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-semibold tracking-wider px-2 mb-2" style={{ color: 'var(--text-tertiary)' }}>
            All Apps
          </div>
          <div className="grid grid-cols-4 gap-1">
            {apps.map(app => (
              <button
                key={app.id}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-white/8 transition-all"
                onClick={() => handleOpenApp(app.id)}
              >
                <span className="text-2xl">{app.icon}</span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/8 transition-all text-xs"
            onClick={() => { handleOpenApp('settings'); }}
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>⚙️</span>
            Settings
          </button>
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/8 transition-all text-xs"
              onClick={() => { useAuthStore.getState().lock(); onClose(); }}
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>🔒</span>
              Lock
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all text-xs"
              onClick={() => { logout(); onClose(); }}
            >
              <span>⏻</span>
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
