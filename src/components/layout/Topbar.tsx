import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useActiveRole } from '../../hooks/useActiveRole';
import { useAlertHistory } from '../../hooks/useAlertHistory';
import { useProjects } from '../../hooks/useProjects';
import { useProject } from '../../hooks/useProject';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { AlertHistoryItem, Persona, Project, ProjectMembership } from '../../api/types';
import './Topbar.css';

const ROLE_LABEL: Record<ProjectMembership['role'], string> = {
  LEAD: 'Lead',
  PM: 'PM',
  ENGINEER: 'Engineer',
};

const DT_FMT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

interface TopbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ collapsed, onToggleSidebar }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const { persona, personas, setPersonaId } = useAuth();
  const { projectId, setProjectId } = useProject();
  const projects = useProjects();
  const role = useActiveRole();

  const alertHistory = useAlertHistory(projectId ?? '');
  const [bellPos, setBellPos] = useState<{ top: number; right: number } | null>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const personaProjects: Array<{ project: Project; membership: ProjectMembership }> = (() => {
    if (!persona || !projects.data) return [];
    return persona.memberships
      .map((m) => {
        const project = projects.data!.find((p) => p.id === m.project_id);
        return project ? { project, membership: m } : null;
      })
      .filter((x): x is { project: Project; membership: ProjectMembership } => x !== null);
  })();

  const showProjectSwitcher = personaProjects.length > 1;
  const activeEntry = personaProjects.find((e) => e.project.id === projectId);
  const projectName = activeEntry?.project.name ?? personaProjects[0]?.project.name ?? '…';

  function openBell() {
    if (bellPos !== null) {
      setBellPos(null);
      return;
    }
    const rect = bellRef.current?.getBoundingClientRect();
    setBellPos(
      rect
        ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
        : { top: 60, right: 18 },
    );
  }

  return (
    <header className="topbar">
      <button
        className="topbar__hamburger"
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="3.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
          <rect x="1" y="7.25" width="14" height="1.5" rx="0.75" fill="currentColor"/>
          <rect x="1" y="11" width="14" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
      </button>

      <div className="topbar__project">
        <span className="topbar__project-tag mono">{projectId ?? '—'}</span>
        <span className="topbar__project-name">{projectName}</span>
        {showProjectSwitcher && (
          <>
            <span className="topbar__project-chev" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <select
              className="topbar__project-select"
              value={projectId ?? ''}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label="Switch project"
            >
              {personaProjects.map(({ project, membership }) => (
                <option key={project.id} value={project.id}>
                  {project.name} · {project.id} — {ROLE_LABEL[membership.role]}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="topbar__center" />

      <div className="topbar__right">
        <DevPersonaSwitcher persona={persona} personas={personas} onChange={setPersonaId} />

        <label
          className="theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="theme-toggle__icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2.5" fill="currentColor"/>
              <line x1="6" y1="0" x2="6" y2="2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6" y1="10" x2="6" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="0" y1="6" x2="2" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="10" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="1.76" y1="1.76" x2="3.17" y2="3.17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="8.83" y1="8.83" x2="10.24" y2="10.24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="1.76" y1="10.24" x2="3.17" y2="8.83" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="8.83" y1="3.17" x2="10.24" y2="1.76" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            type="checkbox"
            className="theme-toggle__input"
            checked={theme === 'dark'}
            onChange={toggle}
          />
          <span className="theme-toggle__track">
            <span className="theme-toggle__thumb" />
          </span>
          <span className="theme-toggle__icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10.5 7.5A4.5 4.5 0 0 1 4.5 1.5a4.5 4.5 0 1 0 6 6z" fill="currentColor"/>
            </svg>
          </span>
        </label>

        <button
          ref={bellRef}
          className="topbar__icon-btn"
          aria-label="Alert history"
          title="Alert history"
          aria-expanded={bellPos !== null}
          onClick={openBell}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 2-.5 3-1.5 4h12c-1-1-1.5-2-1.5-4A4.5 4.5 0 0 0 8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
            <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>

        {persona && (
          <div className="topbar__account" title={persona.display_name}>
            <span className="topbar__avatar mono" aria-hidden="true">{persona.initials}</span>
            <div className="topbar__account-text">
              <span className="topbar__account-name">{persona.display_name}</span>
              <span className="topbar__account-role mono">{activeEntry ? ROLE_LABEL[activeEntry.membership.role].toUpperCase() : ''}</span>
            </div>
          </div>
        )}
      </div>

      {bellPos !== null && (
        <AlertBellPopover
          pos={bellPos}
          role={role}
          items={alertHistory.data ?? []}
          loading={alertHistory.loading}
          onClose={() => setBellPos(null)}
        />
      )}
    </header>
  );
}

function AlertBellPopover({
  pos,
  role,
  items,
  loading,
  onClose,
}: {
  pos: { top: number; right: number };
  role: string | null;
  items: AlertHistoryItem[];
  loading: boolean;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const recent = items.slice(0, 5);
  const isEngineer = role === 'ENGINEER';

  return createPortal(
    <>
      <div className="tb-alert-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={popoverRef}
        className="tb-alert-popover"
        style={{ top: pos.top, right: pos.right }}
        role="dialog"
        aria-label="Recent alert history"
      >
        <div className="tb-alert-popover__header">Recent Alert History</div>

        {isEngineer ? (
          <div className="tb-alert-popover__engineer">
            Alerts are sent directly via Teams for your deliverables.
          </div>
        ) : loading ? (
          <div className="tb-alert-popover__loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="tb-alert-popover__skeleton" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="tb-alert-popover__empty">No alerts yet for this project.</div>
        ) : (
          <ul className="tb-alert-popover__list">
            {recent.map((item) => (
              <li key={item.id} className="tb-alert-popover__item">
                <div className="tb-alert-popover__item-type">{item.alert_type_label}</div>
                <div className="tb-alert-popover__item-meta">
                  <span className="tb-alert-popover__item-recipient">{item.recipient_display_name}</span>
                  <span className="tb-alert-popover__item-time mono">{formatDt(item.created_at)}</span>
                </div>
                {item.document_reference && (
                  <div className="tb-alert-popover__item-ref mono">{item.document_reference}</div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="tb-alert-popover__footer">
          <Link to="/alert-history" className="tb-alert-popover__footer-link" onClick={onClose}>
            View Alert History →
          </Link>
        </div>
      </div>
    </>,
    document.body,
  );
}

function formatDt(iso: string): string {
  return DT_FMT.format(new Date(iso));
}

interface DevPersonaSwitcherProps {
  persona: Persona | null;
  personas: Persona[];
  onChange: (id: string) => void;
}

function DevPersonaSwitcher({ persona, personas, onChange }: DevPersonaSwitcherProps) {
  return (
    <label
      className="dev-persona-switcher"
      title="Dev mode — simulate any persona/membership combination. Replaced by SSO + FusionLive participant sync in production."
    >
      <span className="dev-persona-switcher__tag mono">DEV</span>
      <select
        className="dev-persona-switcher__select"
        value={persona?.id ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Dev persona"
      >
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.display_name} ({p.memberships.length}p)
          </option>
        ))}
      </select>
    </label>
  );
}
