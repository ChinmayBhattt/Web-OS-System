'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowStore } from '@/stores/windowStore';
import { WindowState, ResizeDirection } from '@/types/window';

interface WindowProps {
  windowState: WindowState;
  children: React.ReactNode;
}

const RESIZE_HANDLE_SIZE = 6;

export default function Window({ windowState, children }: WindowProps) {
  const {
    closeWindow, focusWindow, minimizeWindow, toggleMaximize,
    updateWindowPosition, updateWindowBounds
  } = useWindowStore();

  const windowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeDir = useRef<ResizeDirection | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialBounds = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [isVisible, setIsVisible] = useState(true);

  const handlePointerDownDrag = useCallback((e: React.PointerEvent) => {
    if (windowState.isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return;

    isDragging.current = true;
    dragStart.current = { x: e.clientX - windowState.x, y: e.clientY - windowState.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    focusWindow(windowState.id);
  }, [windowState.id, windowState.x, windowState.y, windowState.isMaximized, focusWindow]);

  const handlePointerMoveDrag = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const x = Math.max(0, e.clientX - dragStart.current.x);
    const y = Math.max(0, e.clientY - dragStart.current.y);
    updateWindowPosition(windowState.id, x, y);
  }, [windowState.id, updateWindowPosition]);

  const handlePointerUpDrag = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.PointerEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    if (windowState.isMaximized) return;

    isResizing.current = true;
    resizeDir.current = direction;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialBounds.current = { x: windowState.x, y: windowState.y, w: windowState.width, h: windowState.height };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    focusWindow(windowState.id);
  }, [windowState, focusWindow]);

  const handleResizeMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing.current || !resizeDir.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const dir = resizeDir.current;
    const b = initialBounds.current;

    let x = b.x, y = b.y, w = b.w, h = b.h;

    if (dir.includes('e')) w = Math.max(windowState.minWidth, b.w + dx);
    if (dir.includes('w')) {
      w = Math.max(windowState.minWidth, b.w - dx);
      x = b.x + b.w - w;
    }
    if (dir.includes('s')) h = Math.max(windowState.minHeight, b.h + dy);
    if (dir.includes('n')) {
      h = Math.max(windowState.minHeight, b.h - dy);
      y = b.y + b.h - h;
    }

    updateWindowBounds(windowState.id, x, y, w, h);
  }, [windowState, updateWindowBounds]);

  const handleResizeEnd = useCallback((e: React.PointerEvent) => {
    isResizing.current = false;
    resizeDir.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleWindowClick = useCallback(() => {
    focusWindow(windowState.id);
  }, [windowState.id, focusWindow]);

  const handleDoubleClickTitleBar = useCallback(() => {
    toggleMaximize(windowState.id);
  }, [windowState.id, toggleMaximize]);

  if (windowState.isMinimized) return null;

  const resizeHandles: { direction: ResizeDirection; style: React.CSSProperties }[] = [
    { direction: 'n', style: { top: -RESIZE_HANDLE_SIZE / 2, left: RESIZE_HANDLE_SIZE, right: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: 'n-resize' } },
    { direction: 's', style: { bottom: -RESIZE_HANDLE_SIZE / 2, left: RESIZE_HANDLE_SIZE, right: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: 's-resize' } },
    { direction: 'e', style: { right: -RESIZE_HANDLE_SIZE / 2, top: RESIZE_HANDLE_SIZE, bottom: RESIZE_HANDLE_SIZE, width: RESIZE_HANDLE_SIZE, cursor: 'e-resize' } },
    { direction: 'w', style: { left: -RESIZE_HANDLE_SIZE / 2, top: RESIZE_HANDLE_SIZE, bottom: RESIZE_HANDLE_SIZE, width: RESIZE_HANDLE_SIZE, cursor: 'w-resize' } },
    { direction: 'ne', style: { top: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2, cursor: 'ne-resize' } },
    { direction: 'nw', style: { top: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2, cursor: 'nw-resize' } },
    { direction: 'se', style: { bottom: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2, cursor: 'se-resize' } },
    { direction: 'sw', style: { bottom: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2, cursor: 'sw-resize' } },
  ];

  return (
    <motion.div
      ref={windowRef}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="absolute glass-strong"
      style={{
        left: windowState.isMaximized ? 0 : windowState.x,
        top: windowState.isMaximized ? 0 : windowState.y,
        width: windowState.isMaximized ? '100%' : windowState.width,
        height: windowState.isMaximized ? `calc(100vh - var(--taskbar-height))` : windowState.height,
        zIndex: windowState.zIndex,
        borderRadius: windowState.isMaximized ? 0 : 'var(--window-radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleWindowClick}
    >
      {/* Title Bar */}
      <div
        className="window-titlebar"
        style={{
          background: windowState.isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        }}
        onPointerDown={handlePointerDownDrag}
        onPointerMove={handlePointerMoveDrag}
        onPointerUp={handlePointerUpDrag}
        onDoubleClick={handleDoubleClickTitleBar}
      >
        {/* Traffic light buttons */}
        <div className="flex items-center gap-[7px] mr-2">
          <button
            className={`window-btn ${windowState.isActive ? 'window-btn-close' : 'window-btn-inactive'}`}
            onClick={(e) => { e.stopPropagation(); closeWindow(windowState.id); }}
            aria-label="Close window"
          >✕</button>
          <button
            className={`window-btn ${windowState.isActive ? 'window-btn-minimize' : 'window-btn-inactive'}`}
            onClick={(e) => { e.stopPropagation(); minimizeWindow(windowState.id); }}
            aria-label="Minimize window"
          >−</button>
          <button
            className={`window-btn ${windowState.isActive ? 'window-btn-maximize' : 'window-btn-inactive'}`}
            onClick={(e) => { e.stopPropagation(); toggleMaximize(windowState.id); }}
            aria-label="Maximize window"
          >⤢</button>
        </div>

        {/* Window title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">{windowState.icon}</span>
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {windowState.title}
          </span>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        {children}
      </div>

      {/* Resize handles */}
      {!windowState.isMaximized && resizeHandles.map(({ direction, style }) => (
        <div
          key={direction}
          style={{ ...style, position: 'absolute', zIndex: 1 }}
          onPointerDown={(e) => handleResizeStart(e, direction)}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        />
      ))}
    </motion.div>
  );
}
