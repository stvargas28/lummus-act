import { useNeedsAttention } from '../../hooks/useNeedsAttention';
import type { AttentionItem, InterventionLevel, Role } from '../../api/types';
import { AttentionCard } from './AttentionCard';
import './NeedsAttentionPanel.css';

const PM_GROUPS: Array<{
  level: InterventionLevel;
  label: string;
  helper: string;
}> = [
  {
    level: 'PM_INTERVENTION',
    label: 'PM intervention',
    helper: 'Direct pressure or escalation may be needed.',
  },
  {
    level: 'PM_AWARENESS',
    label: 'PM awareness',
    helper: 'Lead is working it; PM stays in the loop.',
  },
  {
    level: 'LEAD_ACTION',
    label: 'Lead action',
    helper: 'Lead-owned follow-up, visible to PM.',
  },
  {
    level: 'INFO',
    label: 'Monitoring',
    helper: 'Tracked for context.',
  },
];

const LEAD_GROUPS: Array<{
  severity: AttentionItem['severity'];
  label: string;
  helper: string;
}> = [
  {
    severity: 'danger',
    label: 'Overdue',
    helper: 'Past an internal or client date. Work these first.',
  },
  {
    severity: 'warning',
    label: 'At risk',
    helper: 'Still recoverable, but time or review activity is tight.',
  },
  {
    severity: 'info',
    label: 'Informational',
    helper: 'Data quality or coordination items to clean up.',
  },
];

interface NeedsAttentionPanelProps {
  projectId: string;
  role: Role;
}

export function NeedsAttentionPanel({ projectId, role }: NeedsAttentionPanelProps) {
  const { data, loading, error } = useNeedsAttention(projectId);

  if (error) {
    return (
      <section className="attention-panel attention-panel--error" role="alert">
        Failed to load Needs Attention: {error.message}
      </section>
    );
  }

  const items = data ?? [];
  const total = items.length;

  if (loading) {
    return (
      <section className="attention-panel" aria-busy>
        <PanelHeader />
        <div className="attention-panel__skeleton" />
        <div className="attention-panel__skeleton" />
        <div className="attention-panel__skeleton" />
      </section>
    );
  }

  if (total === 0) {
    return (
      <section className="attention-panel attention-panel--empty">
        <PanelHeader />
        <div className="attention-panel__empty">
          <span className="attention-panel__empty-mark">OK</span>
          Nothing needs attention right now.
        </div>
      </section>
    );
  }

  return (
    <section className="attention-panel" aria-label="Needs attention">
      <PanelHeader total={total} />

      <div className="attention-panel__scroll" tabIndex={0}>
        {role === 'PM' ? renderPmGrouped(items, role) : renderLeadGrouped(items, role)}
      </div>

      <div className="attention-panel__footer">
        Auto-triaged items stay here until the deliverable status changes.
      </div>
    </section>
  );
}

function PanelHeader({ total }: { total?: number } = {}) {
  return (
    <header className="attention-panel__header">
      <h2 className="attention-panel__title">
        <span className="attention-panel__mark" aria-hidden="true">!</span>
        Needs Attention
      </h2>
      <div className="attention-panel__sub">
        <span className="attention-panel__auto-tag">auto-triaged</span>
        {total !== undefined && <span className="attention-panel__count">{total} items</span>}
      </div>
    </header>
  );
}

function renderPmGrouped(items: AttentionItem[], role: Role) {
  return (
    <>
      {PM_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.intervention_level === group.level);
        if (groupItems.length === 0) return null;

        return (
          <section key={group.level} className="attention-panel__group" aria-label={group.label}>
            <div className={`attention-panel__group-label attention-panel__group-label--${group.level.toLowerCase().replace('_', '-')}`}>
              <span>{group.label}</span>
              <span className="attention-panel__group-count">{groupItems.length}</span>
            </div>
            <div className="attention-panel__group-helper">{group.helper}</div>
            <ul className="attention-panel__list">
              {groupItems.map((item) => (
                <li key={item.deliverable_id + item.reason_kind}>
                  <AttentionCard item={item} role={role} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function renderLeadGrouped(items: AttentionItem[], role: Role) {
  return (
    <>
      {LEAD_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.severity === group.severity);
        if (groupItems.length === 0) return null;

        return (
          <section key={group.severity} className="attention-panel__group" aria-label={group.label}>
            <div className={`attention-panel__group-label attention-panel__group-label--${group.severity}`}>
              <span>{group.label}</span>
              <span className="attention-panel__group-count">{groupItems.length}</span>
            </div>
            <div className="attention-panel__group-helper">{group.helper}</div>
            <ul className="attention-panel__list">
              {groupItems.map((item) => (
                <li key={item.deliverable_id + item.reason_kind}>
                  <AttentionCard item={item} role={role} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
