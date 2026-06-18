import { LucideIcon } from 'lucide-react';

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  iconComponent?: LucideIcon;
  description?: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  singleton?: boolean;
  category: 'system' | 'utility' | 'productivity' | 'media';
}
