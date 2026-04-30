import { useMemo, useState } from 'react';
import type { ActPhase, Deliverable, Role } from '../api/types';
import { useActiveRole } from '../hooks/useActiveRole';
import { useAuth } from '../hooks/useAuth';
import { useDeliverables } from '../hooks/useDeliverables';
import { useProject } from '../hooks/useProject';
import { useProjects } from '../hooks/useProjects';
import { DeliverablesTable } from '../components/deliverables/DeliverablesTable';
import { PageHeader } from '../components/layout/PageHeader';
import { ProjectSetupNotice } from '../components/shared/ProjectSetupNotice';

const ACTIVE_PHASES: readonly ActPhase[] = ['NOT_STARTED', 'DRAFT', 'REVISING'];
const WAITING_PHASES: readonly ActPhase[] = ['UNDER_REVIEW', 'READY_FOR_ISSUE'];

export function MyWorkPage() {
  const role = useActiveRole();
  const { persona } = useAuth();
  const { projectId } = useProject();
  const projects = useProjects();
  const [showWaiting, setShowWaiting] = useState(false);
  const deliverables = useDeliverables(projectId ?? '');

  const counts = useMemo(
    () => countEngineerWork(deliverables.data ?? [], persona?.user_id ?? null),
    [deliverables.data, persona?.user_id],
  );

  if (!projectId || !role || !persona || (role !== 'ENGINEER' && role !== 'LEAD')) {
    return null;
  }

  const projectName = projects.data?.find((p) => p.id === projectId)?.name ?? projectId;

  if (!deliverables.loading && (deliverables.data?.length ?? 0) === 0) {
    return (
      <div className="my-work-page">
        <PageHeader
          crumbs={[persona.display_name, roleLabel(role)]}
          title="My Work"
        />
        <ProjectSetupNotice projectName={projectName} role={role} />
      </div>
    );
  }

  return (
    <div className="my-work-page">
      <PageHeader
        crumbs={[persona.display_name, roleLabel(role)]}
        title="My Work"
      />

      <section className="my-work-section">
        <div className="my-work-section__intro">
          <div>
            <h2 className="my-work-section__title">Active Items</h2>
            <p className="my-work-section__hint">
              Drafts, revisions, and items not yet in review.
            </p>
          </div>
          <span className="my-work-count mono">{counts.active} active</span>
        </div>
        <DeliverablesTable
          projectId={projectId}
          role="ENGINEER"
          ownerUserId={persona.user_id}
          phaseScope={ACTIVE_PHASES}
          showOwnerFilter={false}
          allowProgressEdit={true}
          emphasis="internal"
        />
      </section>

      <section className="my-work-section my-work-section--waiting">
        <div className="my-work-waiting-head">
          <div className="my-work-waiting-head__copy">
            <span className="section-label">Waiting / Done</span>
            <h2 className="my-work-section__title">No Action Needed</h2>
            <p className="my-work-section__hint">
              In review or ready to issue. These stay visible for context, but progress is locked.
            </p>
          </div>
          <div className="my-work-waiting-head__actions">
            <span className="my-work-count mono">{counts.waiting} waiting</span>
            <button
              type="button"
              className="my-work-toggle"
              onClick={() => setShowWaiting(!showWaiting)}
              aria-expanded={showWaiting}
            >
              <span>{showWaiting ? 'Hide items' : 'Show items'}</span>
              <svg
                className={`my-work-toggle__chevron ${showWaiting ? 'my-work-toggle__chevron--open' : ''}`}
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 5.5L7 8.5L10 5.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {showWaiting && (
          <div className="my-work-waiting-content">
            <DeliverablesTable
              projectId={projectId}
              role="ENGINEER"
              ownerUserId={persona.user_id}
              phaseScope={WAITING_PHASES}
              showOwnerFilter={false}
              allowProgressEdit={false}
              emphasis="internal"
            />
          </div>
        )}
      </section>
    </div>
  );
}

function countEngineerWork(rows: Deliverable[], userId: string | null) {
  const mine = userId ? rows.filter((d) => d.owner_user_id === userId) : [];
  return {
    active: mine.filter((d) => ACTIVE_PHASES.includes(d.act_phase)).length,
    waiting: mine.filter((d) => WAITING_PHASES.includes(d.act_phase)).length,
  };
}

function roleLabel(role: Role): string {
  return role[0] + role.slice(1).toLowerCase();
}
