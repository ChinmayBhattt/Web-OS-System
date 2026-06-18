'use client';

import { useState, useEffect, useCallback } from 'react';

interface ContextMenuState {
  x: number;
  y: number;
  isOpen: boolean;
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ x: 0, y: 0, isOpen: false });

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, isOpen: true });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  useEffect(() => {
    if (menu.isOpen) {
      const handler = () => closeMenu();
      document.addEventListener('click', handler);
      document.addEventListener('contextmenu', handler);
      return () => {
        document.removeEventListener('click', handler);
        document.removeEventListener('contextmenu', handler);
      };
    }
  }, [menu.isOpen, closeMenu]);

  return { menu, openMenu, closeMenu };
}
