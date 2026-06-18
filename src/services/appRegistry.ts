import { AppDefinition } from '@/types/app';

export const APP_REGISTRY: Record<string, AppDefinition> = {
  'file-explorer': {
    id: 'file-explorer',
    name: 'Files',
    icon: '📁',
    description: 'Browse and manage your files',
    defaultWidth: 800,
    defaultHeight: 550,
    minWidth: 500,
    minHeight: 350,
    singleton: false,
    category: 'system',
  },
  'terminal': {
    id: 'terminal',
    name: 'Terminal',
    icon: '⌨️',
    description: 'Command line interface',
    defaultWidth: 700,
    defaultHeight: 450,
    minWidth: 400,
    minHeight: 250,
    singleton: false,
    category: 'system',
  },
  'settings': {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    description: 'System preferences',
    defaultWidth: 750,
    defaultHeight: 550,
    minWidth: 600,
    minHeight: 400,
    singleton: true,
    category: 'system',
  },
  'browser': {
    id: 'browser',
    name: 'Browser',
    icon: '🌐',
    description: 'Web browser',
    defaultWidth: 900,
    defaultHeight: 600,
    minWidth: 500,
    minHeight: 350,
    singleton: false,
    category: 'utility',
  },
  'calculator': {
    id: 'calculator',
    name: 'Calculator',
    icon: '🧮',
    description: 'Perform calculations',
    defaultWidth: 340,
    defaultHeight: 520,
    minWidth: 300,
    minHeight: 460,
    singleton: true,
    category: 'utility',
  },
  'notes': {
    id: 'notes',
    name: 'Notes',
    icon: '📝',
    description: 'Take and organize notes',
    defaultWidth: 700,
    defaultHeight: 500,
    minWidth: 400,
    minHeight: 300,
    singleton: true,
    category: 'productivity',
  },
  'media-player': {
    id: 'media-player',
    name: 'Music',
    icon: '🎵',
    description: 'Audio player',
    defaultWidth: 420,
    defaultHeight: 580,
    minWidth: 350,
    minHeight: 450,
    singleton: true,
    category: 'media',
  },
  'text-editor': {
    id: 'text-editor',
    name: 'Editor',
    icon: '📄',
    description: 'Code and text editor',
    defaultWidth: 800,
    defaultHeight: 550,
    minWidth: 400,
    minHeight: 300,
    singleton: false,
    category: 'productivity',
  },
};

export function getApp(appId: string): AppDefinition | undefined {
  return APP_REGISTRY[appId];
}

export function getAllApps(): AppDefinition[] {
  return Object.values(APP_REGISTRY);
}

export function getAppsByCategory(category: AppDefinition['category']): AppDefinition[] {
  return Object.values(APP_REGISTRY).filter(app => app.category === category);
}
