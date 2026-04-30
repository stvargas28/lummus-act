import { PageHeader } from '../components/layout/PageHeader';
import { useActiveRole } from '../hooks/useActiveRole';
import { useProjects } from '../hooks/useProjects';
import { useProject } from '../hooks/useProject';
import { useSettings } from '../hooks/useSettings';
import type { AppSettings, DefaultLanding, DueFocus, TableDensity } from '../contexts/settings-context';
import './SettingsPage.css';

const DIGEST_TIMES = [
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
];

const DENSITY_OPTIONS: Array<{ value: TableDensity; label: string }> = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'standard', label: 'Standard' },
  { value: 'compact', label: 'Compact' },
];

const DUE_FOCUS_OPTIONS: Array<{ value: DueFocus; label: string }> = [
  { value: 'role', label: 'Role default' },
  { value: 'internal', label: 'Internal' },
  { value: 'client', label: 'Client' },
];

const LANDING_OPTIONS: Array<{ value: DefaultLanding; label: string }> = [
  { value: 'role', label: 'Role default' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'deliverables', label: 'Deliverables' },
  { value: 'my-reviews', label: 'My Reviews' },
];

export function SettingsPage() {
  const role = useActiveRole();
  const { projectId } = useProject();
  const projects = useProjects();
  const { settings, updateSettings } = useSettings();

  const projectName = projects.data?.find((p) => p.id === projectId)?.name ?? projectId ?? 'Project';

  if (!role) return null;

  return (
    <main className="settings-page">
      <PageHeader crumbs={[projectName, roleLabel(role)]} title="Settings" />

      <section className="settings-panel" aria-labelledby="digest-title">
        <div className="settings-panel__head">
          <div>
            <h2 id="digest-title" className="settings-panel__title">Daily Digest</h2>
            <div className="settings-panel__meta mono">Teams / Monday-Friday / project local time</div>
          </div>
          <span className="settings-pill">MVP</span>
        </div>

        <div className="settings-row">
          <label className="settings-label" htmlFor="digest-time">Delivery time</label>
          <select
            id="digest-time"
            className="settings-select"
            value={settings.digestTime}
            onChange={(event) => updateSettings({ digestTime: event.target.value })}
          >
            {DIGEST_TIMES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-includes" aria-label="Digest contents">
          <span>Client risk</span>
          <span>Unmatched rows</span>
          <span>Missing owners</span>
          <span>Phase changes</span>
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="display-title">
        <div className="settings-panel__head">
          <div>
            <h2 id="display-title" className="settings-panel__title">Display</h2>
            <div className="settings-panel__meta mono">Local preference</div>
          </div>
        </div>

        <SegmentedSetting
          label="Table density"
          value={settings.tableDensity}
          options={DENSITY_OPTIONS}
          onChange={(tableDensity) => updateSettings({ tableDensity })}
        />

        <SegmentedSetting
          label="Due date focus"
          value={settings.dueFocus}
          options={DUE_FOCUS_OPTIONS}
          onChange={(dueFocus) => updateSettings({ dueFocus })}
        />

        <div className="settings-row">
          <label className="settings-label" htmlFor="default-landing">Default page</label>
          <select
            id="default-landing"
            className="settings-select"
            value={settings.defaultLanding}
            onChange={(event) => updateSettings({ defaultLanding: event.target.value as AppSettings['defaultLanding'] })}
          >
            {LANDING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="settings-panel settings-panel--future" aria-labelledby="future-title">
        <div className="settings-panel__head">
          <div>
            <h2 id="future-title" className="settings-panel__title">Later</h2>
            <div className="settings-panel__meta mono">Configuration candidates</div>
          </div>
        </div>
        <div className="settings-future">
          <span>Saved filters</span>
          <span>Digest recipients</span>
          <span>Owner aliases</span>
        </div>
      </section>
    </main>
  );
}

interface SegmentedSettingProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

function SegmentedSetting<T extends string>({ label, value, options, onChange }: SegmentedSettingProps<T>) {
  return (
    <div className="settings-row settings-row--segmented">
      <div className="settings-label">{label}</div>
      <div className="settings-segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`settings-segmented__btn ${value === option.value ? 'settings-segmented__btn--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function roleLabel(role: string): string {
  return role[0] + role.slice(1).toLowerCase();
}
