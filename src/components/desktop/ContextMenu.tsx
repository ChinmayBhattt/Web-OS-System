'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MenuItem {
  label?: string;
  icon?: string;
  action?: () => void;
  type?: 'separator';
  disabled?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1920) - 220);
  const adjustedY = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 1080) - items.length * 36);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="context-menu glass-strong"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <div key={i} className="context-menu-separator" />;
        }
        return (
          <div
            key={i}
            className={`context-menu-item ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
          >
            {item.icon && <span className="text-sm w-5 text-center">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-[11px] opacity-50 ml-4">{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
