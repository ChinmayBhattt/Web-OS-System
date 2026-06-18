'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';

export default function NotificationCenter() {
  const { notifications, showCenter, setShowCenter, markRead, removeNotification, clearAll, markAllRead } = useNotificationStore();

  if (!showCenter) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9990]" onClick={() => setShowCenter(false)} />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="absolute right-2 top-2 bottom-[56px] z-[9991] glass-strong rounded-xl overflow-hidden flex flex-col"
        style={{ width: '340px' }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
          <div className="flex gap-2">
            <button
              className="text-[11px] px-2 py-1 rounded hover:bg-white/10 transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onClick={markAllRead}
            >
              Mark all read
            </button>
            <button
              className="text-[11px] px-2 py-1 rounded hover:bg-white/10 transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <span className="text-3xl opacity-30">🔔</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No notifications</span>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg mb-1 cursor-pointer transition-all hover:bg-white/5 ${!notif.read ? 'border-l-2' : ''}`}
                style={{
                  borderLeftColor: !notif.read ? 'var(--accent)' : 'transparent',
                  opacity: notif.read ? 0.6 : 1,
                }}
                onClick={() => markRead(notif.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{notif.icon || '💬'}</span>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{notif.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{notif.message}</div>
                      <div className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-xs opacity-40 hover:opacity-100 transition-all p-1"
                    onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}
