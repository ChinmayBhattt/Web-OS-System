'use client';

import React, { useState } from 'react';
import { useThemeStore, ACCENT_COLORS, WALLPAPERS, AccentColor, ThemeMode } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

interface SettingsProps {
  windowId: string;
}

type SettingsSection = 'appearance' | 'display' | 'account' | 'about' | 'shortcuts';

export default function Settings({ windowId }: SettingsProps) {
  const [section, setSection] = useState<SettingsSection>('appearance');
  const { mode, setMode, accentColor, setAccentColor, wallpaper, setWallpaper, fontSize, setFontSize } = useThemeStore();
  const { username } = useAuthStore();

  const sections: { id: SettingsSection; label: string; icon: string }[] = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'display', label: 'Display', icon: '🖥️' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  const shortcuts = [
    { keys: 'Ctrl/⌘ + E', action: 'Open File Explorer' },
    { keys: 'Ctrl/⌘ + T', action: 'Open Terminal' },
    { keys: 'Ctrl/⌘ + W', action: 'Close Active Window' },
    { keys: 'Ctrl/⌘ + L', action: 'Lock Screen' },
    { keys: 'Ctrl/⌘ + D', action: 'Show Desktop' },
    { keys: 'Ctrl/⌘ + ,', action: 'Open Settings' },
    { keys: 'Alt + Tab', action: 'Cycle Windows' },
  ];

  return (
    <div className="flex h-full" style={{ fontSize: '13px' }}>
      {/* Sidebar */}
      <div className="w-52 border-r flex-shrink-0 py-3 overflow-y-auto" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <div className="px-4 mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
        </div>
        {sections.map(s => (
          <button
            key={s.id}
            className={`w-full flex items-center gap-3 px-4 py-2 transition-all text-left text-xs ${
              section === s.id ? 'font-medium' : ''
            }`}
            style={{
              background: section === s.id ? 'var(--accent-muted)' : 'transparent',
              color: section === s.id ? 'var(--accent)' : 'var(--text-secondary)',
            }}
            onClick={() => setSection(s.id)}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {section === 'appearance' && (
          <div className="space-y-6 max-w-lg">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h3>

            {/* Theme Mode */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Theme</label>
              <div className="flex gap-2">
                {(['dark', 'light', 'auto'] as ThemeMode[]).map(m => (
                  <button
                    key={m}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize"
                    style={{
                      background: mode === m ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: mode === m ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                    onClick={() => setMode(m)}
                  >
                    {m === 'auto' ? '🌗 Auto' : m === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Accent Color</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(ACCENT_COLORS) as [AccentColor, typeof ACCENT_COLORS[AccentColor]][]).map(([key, val]) => (
                  <button
                    key={key}
                    className="w-8 h-8 rounded-full transition-all relative"
                    style={{
                      background: `hsl(${val.hue}, ${val.sat}%, ${val.light}%)`,
                      outline: accentColor === key ? '2px solid var(--text-primary)' : 'none',
                      outlineOffset: '2px',
                    }}
                    onClick={() => setAccentColor(key)}
                    title={val.label}
                  >
                    {accentColor === key && <span className="text-white text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Wallpaper</label>
              <div className="grid grid-cols-4 gap-2">
                {WALLPAPERS.map((wp, i) => (
                  <button
                    key={wp}
                    className="aspect-video rounded-lg overflow-hidden transition-all"
                    style={{
                      outline: wallpaper === wp ? '2px solid var(--accent)' : '1px solid var(--border)',
                      outlineOffset: '1px',
                    }}
                    onClick={() => setWallpaper(wp)}
                  >
                    <img src={wp} alt={`Wallpaper ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'display' && (
          <div className="space-y-6 max-w-lg">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Display</h3>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Font Size: {fontSize}px</label>
              <input
                type="range"
                min="12"
                max="18"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          </div>
        )}

        {section === 'account' && (
          <div className="space-y-6 max-w-lg">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Account</h3>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
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
        )}

        {section === 'shortcuts' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</h3>
            <div className="space-y-1">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.action}</span>
                  <kbd className="text-[11px] px-2 py-0.5 rounded font-mono" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'about' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>About WebOS</h3>
            <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              {[
                ['OS Name', 'WebOS'],
                ['Version', '1.0.0'],
                ['Built With', 'Next.js, React, TypeScript'],
                ['Styling', 'Tailwind CSS v4'],
                ['State', 'Zustand'],
                ['Storage', 'IndexedDB'],
                ['Rendering', 'Client-Side SPA'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
