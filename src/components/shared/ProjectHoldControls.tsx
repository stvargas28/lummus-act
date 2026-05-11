import { useState } from 'react';
import { updateProjectHold } from '../../api';
import type { Project, Role } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from './ConfirmDialog';
import './ProjectHoldControls.css';

interface ProjectHoldProps {
  projectId: string;
  project: Project | null;
  role: Role;
  onProjectChange: (project: Project) => void;
}

export function ProjectHoldButton({ projectId, project, role, onProjectChange }: ProjectHoldProps) {
  const { persona } = useAuth();
  const { push } = useToast();
  const [pendingActive, setPendingActive] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const projectOnHold = project?.hold_active ?? false;

  if (role !== 'PM') return null;

  const setHold = async (active: boolean) => {
    if (!persona) return;
    setSaving(true);
    try {
      const next = await updateProjectHold(projectId, active, persona.user_id);
      onProjectChange(next);
      setPendingActive(null);
      push(active ? 'Project hold enabled.' : 'Project alerts resumed.', 'success');
    } catch {
      push(active ? 'Could not put project on hold.' : 'Could not resume project alerts.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const nextActive = pendingActive ?? !projectOnHold;

  return (
    <>
      <button
        type="button"
        className={`project-hold-button ${projectOnHold ? 'project-hold-button--active' : ''}`}
        onClick={() => setPendingActive(!projectOnHold)}
      >
        {projectOnHold ? 'Resume alerts' : 'Hold project'}
      </button>
      <ConfirmDialog
        open={pendingActive !== null}
        title={nextActive ? 'Put project on hold?' : 'Resume project alerts?'}
        body={
          nextActive
            ? 'Notifications will pause and risk colors will freeze. Deliverables will remain visible.'
            : 'ACT will evaluate alerts against the current due dates. Missed alerts from the hold period will not replay.'
        }
        confirmLabel={nextActive ? 'Put on hold' : 'Resume alerts'}
        busy={saving}
        onCancel={() => setPendingActive(null)}
        onConfirm={() => setHold(nextActive)}
      />
    </>
  );
}

export function ProjectHoldBanner({ projectId, project, role, onProjectChange }: ProjectHoldProps) {
  if (!project?.hold_active) return null;

  return (
    <section className="project-hold-banner" aria-label="Project hold">
      <div>
        <div className="project-hold-banner__title">Project on hold - notifications paused</div>
        <div className="project-hold-banner__copy">
          Risk indicators are frozen until the PM lifts hold.
        </div>
      </div>
      {role === 'PM' && (
        <ProjectHoldButton
          projectId={projectId}
          project={project}
          role={role}
          onProjectChange={onProjectChange}
        />
      )}
    </section>
  );
}
