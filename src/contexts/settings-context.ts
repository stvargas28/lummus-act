import { createContext } from 'react';

export type TableDensity = 'comfortable' | 'standard' | 'compact';
export type DueFocus = 'role' | 'internal' | 'client';
export type DefaultLanding = 'role' | 'dashboard' | 'deliverables' | 'my-reviews';

export interface AppSettings {
  digestTime: string;
  tableDensity: TableDensity;
  dueFocus: DueFocus;
  defaultLanding: DefaultLanding;
}

export interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export const DEFAULT_SETTINGS: AppSettings = {
  digestTime: '15:00',
  tableDensity: 'standard',
  dueFocus: 'role',
  defaultLanding: 'role',
};

export const SETTINGS_STORAGE_KEY = 'act:settings';
export const SettingsContext = createContext<SettingsContextValue | null>(null);
