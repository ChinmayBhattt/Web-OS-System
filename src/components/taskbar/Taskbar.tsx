'use client';

import React, { useState, useEffect } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { useNotificationStore } from '@/stores/notificationStore';
import StartMenu from './StartMenu';
import { motion, AnimatePresence } from 'framer-motion';

export default function Taskbar() {
  const { windows, focusWindow, minimizeWindow, restoreWindow, activeWindowId } = useWindowStore();
  const { unreadCount, toggleCenter } = useNotificationStore();
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskbarClick = (windowId: string) => {
    const win = windows.find(w => w.id === windowId);
    if (!win) return;
    if (win.isMinimized) {
      restoreWindow(windowId);
    } else if (win.isActive) {
      minimizeWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  return (
    <>
      {/* Start Menu */}
      <AnimatePresence>
        {showStartMenu && (
          <StartMenu onClose={() => setShowStartMenu(false)} />
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <div
        className="absolute bottom-0 left-0 right-0 glass-strong flex items-center px-2 gap-1 z-[9999]"
        style={{ height: 'var(--taskbar-height)' }}
      >
        {/* Start Button */}
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:bg-white/10 active:bg-white/15"
          onClick={() => setShowStartMenu(!showStartMenu)}
          aria-label="Start menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.9"/>
            <rect x="11" y="1" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.7"/>
            <rect x="1" y="11" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.7"/>
            <rect x="11" y="11" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.5"/>
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Running Apps */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {windows.map(win => (
            <button
              key={win.id}
              className={`flex items-center gap-2 px-3 h-9 rounded-lg text-xs font-medium transition-all min-w-0 max-w-[180px] ${
                win.isActive && !win.isMinimized
                  ? 'bg-white/15'
                  : 'hover:bg-white/8'
              }`}
              style={{
                borderBottom: win.isActive && !win.isMinimized ? '2px solid var(--accent)' : '2px solid transparent',
                color: 'var(--text-primary)',
              }}
              onClick={() => handleTaskbarClick(win.id)}
              title={win.title}
            >
              <span className="text-sm flex-shrink-0">{win.icon}</span>
              <span className="truncate">{win.title}</span>
            </button>
          ))}
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-all"
            onClick={toggleCenter}
            aria-label="Notifications"
          >
            <span className="text-sm">🔔</span>
            {unreadCount() > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount()}
              </span>
            )}
          </button>

          {/* Volume */}
          <button className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-all" aria-label="Volume">
            <span className="text-sm">🔊</span>
          </button>

          {/* WiFi */}
          <button className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-all" aria-label="WiFi">
            <span className="text-sm">📶</span>
          </button>

          {/* Clock */}
          <div className="flex flex-col items-end px-2 cursor-default">
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{time}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{date}</span>
          </div>
        </div>
      </div>
    </>
  );
}
