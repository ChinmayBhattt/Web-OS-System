'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'teal' | 'rose' | 'amber' | 'emerald' | 'indigo' | 'orange';

interface ThemeStore {
  mode: ThemeMode;
  accentColor: AccentColor;
  wallpaper: string;
  fontSize: number;

  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setWallpaper: (wallpaper: string) => void;
  setFontSize: (size: number) => void;
  resolvedMode: () => 'dark' | 'light';
}

export const ACCENT_COLORS: Record<AccentColor, { hue: number; sat: number; light: number; label: string }> = {
  blue:    { hue: 217, sat: 91, light: 60, label: 'Blue' },
  purple:  { hue: 270, sat: 76, light: 60, label: 'Purple' },
  teal:    { hue: 172, sat: 66, light: 50, label: 'Teal' },
  rose:    { hue: 350, sat: 89, light: 60, label: 'Rose' },
  amber:   { hue: 38,  sat: 92, light: 50, label: 'Amber' },
  emerald: { hue: 160, sat: 84, light: 39, label: 'Emerald' },
  indigo:  { hue: 239, sat: 84, light: 67, label: 'Indigo' },
  orange:  { hue: 25,  sat: 95, light: 53, label: 'Orange' },
};

export const WALLPAPERS = [
  '/wallpapers/gradient-dark.svg',
  '/wallpapers/gradient-aurora.svg',
  '/wallpapers/gradient-sunset.svg',
  '/wallpapers/gradient-ocean.svg',
];

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      accentColor: 'blue',
      wallpaper: WALLPAPERS[0],
      fontSize: 14,

      setMode: (mode) => set({ mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setFontSize: (size) => set({ fontSize: size }),
      resolvedMode: () => {
        const { mode } = get();
        if (mode === 'auto') {
          if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          return 'dark';
        }
        return mode;
      },
    }),
    { name: 'webos-theme' }
  )
);
