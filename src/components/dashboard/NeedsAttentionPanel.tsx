import { useState } from 'react';
import { useNeedsAttention } from '../../hooks/useNeedsAttention';
import type { AttentionItem, Role } from '../../api/types';
import { AttentionCard } from './AttentionCard';
import './NeedsAttentionPanel.css';

const MAX_VISIBLE = 5;

interface NeedsAttentionPanelProps {
  projectId: string;
  role: Role;
}

export function NeedsAttentionPanel({ projectId, role }: NeedsAttentionPanelProps) {
  const { data, loading, error } = useNeedsAttention(projectId);
  const [expanded, setExpanded] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

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
          <span className="attention-panel__empty-mark">✓</span>
          Nothing needs attention right now.
        </div>
      </section>
    );
  }

  const visible = expanded ? items : items.slice(0, MAX_VISIBLE);

  return (
    <section className="attention-panel" aria-label="Needs attention">
      <PanelHeader total={total} />

      {role === 'PM'
        ? renderPmGrouped(visible, internalCollapsed, setInternalCollapsed, role)
        : renderFlat(visible, role)}

      {total > MAX_VISIBLE && (
        <button
          type="button"
          className="attention-panel__expand"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show fewer' : `Show all ${total} flagged items →`}
        </button>
      )}
    </section>
  );
}

function PanelHeader({ total }: { total?: number } = {}) {
  return (
    <header className="attention-panel__header">
      <h2 className="attention-panel__title">
        Needs attention
        <span className="attention-panel__auto-tag">auto-triaged</span>
      </h2>
      <div className="attention-panel__sub">
        {total !== undefined && <span className="attention-panel__count">{total} flagged</span>}
      </div>
    </header>
  );
}

function renderFlat(items: AttentionItem[], role: Role) {
  return (
    <ul className="attention-panel__list">
      {items.map((item) => (
        <li key={item.deliverable_id + item.reason_kind}>
          <AttentionCard item={item} role={role} />
        </li>
      ))}
    </ul>
  );
}

function renderPmGrouped(
  items: AttentionItem[],
  internalCollapsed: boolean,
  setInternalCollapsed: (v: boolean) => void,
  role: Role,
) {
  const clientRisk = items.filter((i) => i.category === 'CLIENT_RISK');
  const internal = items.filter((i) => i.category === 'INTERNAL');

  return (
    <>
      {clientRisk.length > 0 && (
        <>
          <div className="attention-panel__group-label">Client risk</div>
          <ul className="attention-panel__list">
            {clientRisk.map((item) => (
              <li key={item.deliverable_id + item.reason_kind}>
                <AttentionCard item={item} role={role} />
              </li>
            ))}
          </ul>
        </>
      )}
      {internal.length > 0 && (
        <>
          <button
            type="button"
            className="attention-panel__group-label attention-panel__group-label--toggle"
            onClick={() => setInternalCollapsed(!internalCollapsed)}
            aria-expanded={!internalCollapsed}
          >
            <span>{internalCollapsed ? '▸' : '▾'}</span>
            Internal ({internal.length})
          </button>
          {!internalCollapsed && (
            <ul className="attention-panel__list">
              {internal.map((item) => (
                <li key={item.deliverable_id + item.reason_kind}>
                  <AttentionCard item={item} role={role} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
