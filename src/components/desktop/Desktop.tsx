'use client';

import React from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useWindowStore } from '@/stores/windowStore';
import { useContextMenu } from '@/hooks/useContextMenu';
import { getAllApps } from '@/services/appRegistry';
import { AnimatePresence } from 'framer-motion';
import Window from '@/components/window/Window';
import Taskbar from '@/components/taskbar/Taskbar';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import ContextMenu from '@/components/desktop/ContextMenu';
import DesktopIcon from '@/components/desktop/DesktopIcon';

// Dynamic imports for apps
import FileExplorer from '@/apps/file-explorer/FileExplorer';
import Terminal from '@/apps/terminal/Terminal';
import Settings from '@/apps/settings/Settings';
import Calculator from '@/apps/calculator/Calculator';
import Notes from '@/apps/notes/Notes';
import BrowserApp from '@/apps/browser/BrowserApp';
import MediaPlayer from '@/apps/media-player/MediaPlayer';
import TextEditor from '@/apps/text-editor/TextEditor';

const APP_COMPONENTS: Record<string, React.FC<{ windowId: string }>> = {
  'file-explorer': FileExplorer,
  'terminal': Terminal,
  'settings': Settings,
  'calculator': Calculator,
  'notes': Notes,
  'browser': BrowserApp,
  'media-player': MediaPlayer,
  'text-editor': TextEditor,
};

const DESKTOP_SHORTCUTS = [
  { appId: 'file-explorer', label: 'Files' },
  { appId: 'terminal', label: 'Terminal' },
  { appId: 'browser', label: 'Browser' },
  { appId: 'notes', label: 'Notes' },
  { appId: 'settings', label: 'Settings' },
];

export default function Desktop() {
  const { wallpaper } = useThemeStore();
  const { windows, openWindow } = useWindowStore();
  const { menu, openMenu, closeMenu } = useContextMenu();

  const contextMenuItems = [
    { label: 'Open Terminal', icon: '⌨️', action: () => openWindow('terminal') },
    { label: 'Open Files', icon: '📁', action: () => openWindow('file-explorer') },
    { type: 'separator' as const },
    { label: 'New Folder', icon: '📂', action: () => openWindow('file-explorer') },
    { label: 'New File', icon: '📄', action: () => openWindow('text-editor') },
    { type: 'separator' as const },
    { label: 'Change Wallpaper', icon: '🖼️', action: () => openWindow('settings') },
    { label: 'Display Settings', icon: '🖥️', action: () => openWindow('settings') },
  ];

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onContextMenu={openMenu}
    >
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-[1]">
        {DESKTOP_SHORTCUTS.map(shortcut => {
          const app = getAllApps().find(a => a.id === shortcut.appId);
          if (!app) return null;
          return (
            <DesktopIcon
              key={shortcut.appId}
              icon={app.icon}
              label={shortcut.label}
              onDoubleClick={() => openWindow(shortcut.appId)}
            />
          );
        })}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map(win => {
          const AppComponent = APP_COMPONENTS[win.appId];
          if (!AppComponent) return null;
          return (
            <Window key={win.id} windowState={win}>
              <AppComponent windowId={win.id} />
            </Window>
          );
        })}
      </AnimatePresence>

      {/* Context Menu */}
      {menu.isOpen && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={contextMenuItems}
          onClose={closeMenu}
        />
      )}

      {/* Notification Center */}
      <NotificationCenter />

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
