import { useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SettingsContext,
  type AppSettings,
  type DefaultLanding,
  type DueFocus,
  type TableDensity,
} from './settings-context';

function isTableDensity(value: unknown): value is TableDensity {
  return value === 'comfortable' || value === 'standard' || value === 'compact';
}

function isDueFocus(value: unknown): value is DueFocus {
  return value === 'role' || value === 'internal' || value === 'client';
}

function isDefaultLanding(value: unknown): value is DefaultLanding {
  return value === 'role' || value === 'dashboard' || value === 'deliverables' || value === 'my-reviews';
}

function readInitial(): AppSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      digestTime: typeof parsed.digestTime === 'string' ? parsed.digestTime : DEFAULT_SETTINGS.digestTime,
      tableDensity: isTableDensity(parsed.tableDensity) ? parsed.tableDensity : DEFAULT_SETTINGS.tableDensity,
      dueFocus: isDueFocus(parsed.dueFocus) ? parsed.dueFocus : DEFAULT_SETTINGS.dueFocus,
      defaultLanding: isDefaultLanding(parsed.defaultLanding) ? parsed.defaultLanding : DEFAULT_SETTINGS.defaultLanding,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', settings.tableDensity);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
