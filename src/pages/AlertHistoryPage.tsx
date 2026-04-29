import { useMemo, useState } from 'react';
import type { AlertHistoryEngagement, AlertHistoryItem, AlertHistorySource, AlertHistoryStatus } from '../api/types';
import { useActiveRole } from '../hooks/useActiveRole';
import { useAuth } from '../hooks/useAuth';
import { useAlertHistory } from '../hooks/useAlertHistory';
import { useProject } from '../hooks/useProject';
import { PageHeader } from '../components/layout/PageHeader';
import './AlertHistoryPage.css';

const DT_FMT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
});

type FilterChip = 'all' | 'open' | 'resolved' | 'auto' | 'manual';

export function AlertHistoryPage() {
  const role = useActiveRole();
  const { persona } = useAuth();
  const { projectId } = useProject();
  const [filter, setFilter] = useState<FilterChip>('all');
  const [query, setQuery] = useState('');

  const history = useAlertHistory(projectId ?? '');

  const stats = useMemo(() => buildStats(history.data ?? []), [history.data]);
  const rows = useMemo(
    () => filterHistory(history.data ?? [], filter, query),
    [history.data, filter, query],
  );

  if (!projectId || !role || !persona) return null;

  if (history.error) {
    return (
      <div className="ah-page">
        <PageHeader crumbs={[persona.display_name, roleLabel(role)]} title="Alert History" />
        <div className="ah-error" role="alert">Failed to load alert history: {history.error.message}</div>
      </div>
    );
  }

  const chips: { key: FilterChip; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'auto', label: 'Auto' },
    { key: 'manual', label: 'Manual' },
  ];

  return (
    <div className="ah-page">
      <PageHeader crumbs={[persona.display_name, roleLabel(role)]} title="Alert History" />

      <section className="ah-summary" aria-label="Alert summary">
        <AhMetric label="Sent today" value={stats.sentToday} />
        <AhMetric label="Acknowledged" value={stats.acknowledged} tone="accent" />
        <AhMetric label="Action clicked" value={stats.actionClicked} tone="success" />
        <AhMetric label="Still open" value={stats.stillOpen} tone={stats.stillOpen > 0 ? 'warn' : 'neutral'} />
      </section>

      <section className="ah-panel" aria-label="Alert log">
        <div className="ah-panel__toolbar">
          <div>
            <span className="section-label">Alert Log</span>
            <h2 className="ah-panel__title">Notification History</h2>
          </div>
          <div className="ah-toolbar-right">
            <div className="ah-chips" role="group" aria-label="Filter alerts">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className={`ah-chip${filter === chip.key ? ' ah-chip--active' : ''}`}
                  onClick={() => setFilter(chip.key)}
                  aria-pressed={filter === chip.key}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="ah-search">
              <span className="ah-search__icon" aria-hidden="true">⌕</span>
              <input
                className="ah-search__input"
                type="search"
                placeholder="Filter by ref, recipient…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Filter alert history"
              />
            </div>
          </div>
        </div>
        <div className="ah-count mono">{rows.length} {rows.length === 1 ? 'entry' : 'entries'}</div>

        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type · Trigger</th>
                <th>Deliverable</th>
                <th>Recipient</th>
                <th>Source</th>
                <th>Engagement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`loading-${i}`} className="ah-table__loading">
                    <td colSpan={7}><div className="ah-skeleton" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td className="ah-empty" colSpan={7}>No alert history matches the current filters.</td>
                </tr>
              ) : (
                rows.map((item) => <AhRow key={item.id} item={item} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AhRow({ item }: { item: AlertHistoryItem }) {
  return (
    <tr className="ah-table__row">
      <td className="ah-table__time mono">{formatDt(item.created_at)}</td>
      <td className="ah-table__type-trigger">
        <div className="ah-type-trigger">
          <TypeChip type={item.alert_type} label={item.alert_type_label} />
          <span className="ah-trigger-text" title={item.trigger_text}>{item.trigger_text}</span>
        </div>
      </td>
      <td className="ah-table__ref mono">{item.document_reference ?? <span className="ah-none">—</span>}</td>
      <td className="ah-table__recipient">{item.recipient_display_name}</td>
      <td><SourceChip source={item.source} label={item.source_display_name} /></td>
      <td><EngagementChip engagement={item.engagement} /></td>
      <td><AhStatusChip status={item.status} resolvedAt={item.resolved_at} reason={item.resolution_reason} /></td>
    </tr>
  );
}

function TypeChip({ type, label }: { type: string; label: string }) {
  const tone = type.includes('14') || type.includes('OVERDUE')
    ? 'danger'
    : type === 'MANUAL_NUDGE'
    ? 'info'
    : 'warn';
  return <span className={`ah-chip-tag ah-chip-tag--${tone}`}>{label}</span>;
}

function SourceChip({ source, label }: { source: AlertHistorySource; label: string | null }) {
  const tone = source === 'MANUAL' ? 'info' : 'muted';
  return <span className={`ah-chip-tag ah-chip-tag--${tone}`}>{label ?? source}</span>;
}

function EngagementChip({ engagement }: { engagement: AlertHistoryEngagement }) {
  const map: Record<AlertHistoryEngagement, { label: string; tone: string }> = {
    SENT: { label: 'Sent', tone: 'muted' },
    ACKNOWLEDGED: { label: 'Acknowledged', tone: 'primary' },
    ACTION_CLICKED: { label: 'Action clicked', tone: 'success' },
  };
  const { label, tone } = map[engagement];
  return <span className={`ah-chip-tag ah-chip-tag--${tone}`}>{label}</span>;
}

function AhStatusChip({
  status,
  resolvedAt,
  reason,
}: {
  status: AlertHistoryStatus;
  resolvedAt: string | null;
  reason: string | null;
}) {
  const map: Record<AlertHistoryStatus, { label: string; tone: string }> = {
    OPEN: { label: 'Open', tone: 'primary' },
    RESOLVED: { label: 'Resolved', tone: 'success' },
    FAILED: { label: 'Failed', tone: 'danger' },
  };
  const { label, tone } = map[status];
  const title = resolvedAt ? `${reason ?? 'Resolved'} · ${formatDt(resolvedAt)}` : undefined;
  return <span className={`ah-chip-tag ah-chip-tag--${tone}`} title={title}>{label}</span>;
}

function AhMetric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger';
}) {
  return (
    <div className={`ah-metric ah-metric--${tone}`}>
      <span className="ah-metric__label">{label}</span>
      <span className="ah-metric__value">{value}</span>
    </div>
  );
}

function buildStats(items: AlertHistoryItem[]) {
  const todayStr = new Date().toISOString().slice(0, 10);
  return items.reduce(
    (acc, item) => {
      if (item.created_at.startsWith(todayStr)) acc.sentToday += 1;
      if (item.engagement === 'ACKNOWLEDGED' || item.engagement === 'ACTION_CLICKED') acc.acknowledged += 1;
      if (item.engagement === 'ACTION_CLICKED') acc.actionClicked += 1;
      if (item.status === 'OPEN') acc.stillOpen += 1;
      return acc;
    },
    { sentToday: 0, acknowledged: 0, actionClicked: 0, stillOpen: 0 },
  );
}

function filterHistory(items: AlertHistoryItem[], filter: FilterChip, query: string): AlertHistoryItem[] {
  let result = items;

  if (filter === 'open') result = result.filter((i) => i.status === 'OPEN');
  else if (filter === 'resolved') result = result.filter((i) => i.status === 'RESOLVED');
  else if (filter === 'auto') result = result.filter((i) => i.source === 'AUTO');
  else if (filter === 'manual') result = result.filter((i) => i.source === 'MANUAL');

  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter((i) => {
      const hay = `${i.document_reference ?? ''} ${i.recipient_display_name} ${i.alert_type_label} ${i.trigger_text}`.toLowerCase();
      return hay.includes(q);
    });
  }

  return result;
}

function formatDt(iso: string): string {
  return DT_FMT.format(new Date(iso));
}

function roleLabel(role: string): string {
  return role[0] + role.slice(1).toLowerCase();
}
