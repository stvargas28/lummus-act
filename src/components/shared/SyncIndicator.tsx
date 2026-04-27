import { useSyncStatus } from '../../hooks/useSyncStatus';
import './SyncIndicator.css';

const STATE_META = {
  synced: { dotClass: 'sync-dot--synced', label: (m: number) => `FusionLive · synced ${m} min ago` },
  syncing: { dotClass: 'sync-dot--syncing', label: () => 'Syncing…' },
  stale: { dotClass: 'sync-dot--stale', label: (m: number) => `Last synced ${m} min ago` },
  error: { dotClass: 'sync-dot--error', label: () => 'Sync failed' },
} as const;

interface SyncIndicatorProps {
  /** Compact mode renders an icon-only button with a tooltip — used in dark topbar. */
  compact?: boolean;
  /** Pill mode renders a light pill suitable for the page header (white card area). */
  variant?: 'pill' | 'dark';
}

export function SyncIndicator({ compact, variant = 'dark' }: SyncIndicatorProps) {
  const { data } = useSyncStatus();
  const state = data?.state ?? 'syncing';
  const meta = STATE_META[state];
  const minutes = data?.minutes_since_sync ?? 0;
  const fullLabel = meta.label(minutes);

  if (compact) {
    return (
      <button
        className={`sync-indicator sync-indicator--compact sync-indicator--${state}`}
        title={fullLabel}
        aria-label={fullLabel}
      >
        <span className={`sync-dot ${meta.dotClass}`} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={`sync-indicator sync-indicator--${variant} sync-indicator--${state}`} title={fullLabel}>
      <span className={`sync-dot ${meta.dotClass}`} aria-hidden="true" />
      <span className="sync-indicator__label">{fullLabel}</span>
    </div>
  );
}
