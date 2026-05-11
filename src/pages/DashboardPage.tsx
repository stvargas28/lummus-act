import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useActiveRole } from '../hooks/useActiveRole';
import { useDeliverables } from '../hooks/useDeliverables';
import { useProject } from '../hooks/useProject';
import { useProjects } from '../hooks/useProjects';
import { KpiCardRow } from '../components/dashboard/KpiCardRow';
import { WorkflowFunnel } from '../components/dashboard/WorkflowFunnel';
import { NeedsAttentionPanel } from '../components/dashboard/NeedsAttentionPanel';
import { DeliverablesTable } from '../components/deliverables/DeliverablesTable';
import { PageHeader } from '../components/layout/PageHeader';
import { ProjectSetupNotice } from '../components/shared/ProjectSetupNotice';
import { ProjectHoldBanner, ProjectHoldButton } from '../components/shared/ProjectHoldControls';
import { SyncIndicator } from '../components/shared/SyncIndicator';
import type { Project } from '../api/types';
import type { ActPhase } from '../api/types';
import './DashboardPage.css';

export function DashboardPage() {
  const role = useActiveRole();
  const { projectId } = useProject();
  const projects = useProjects();
  const deliverables = useDeliverables(projectId ?? '');
  const [selectedPhase, setSelectedPhase] = useState<ActPhase | null>(null);
  const [projectHold, setProjectHold] = useState<Project | null>(null);

  useEffect(() => {
    setProjectHold(null);
  }, [projectId]);

  if (!projectId || !role || (role !== 'LEAD' && role !== 'PM')) {
    return null;
  }

  const loadedProject = projects.data?.find((p) => p.id === projectId) ?? null;
  const project = projectHold?.id === projectId ? projectHold : loadedProject;
  const projectName = project?.name ?? projectId;
  const projectOnHold = project?.hold_active ?? false;
  const roleLabel = role === 'PM' ? 'PM' : 'Lead';
  const isUnconfigured = !deliverables.loading && (deliverables.data?.length ?? 0) === 0;

  if (isUnconfigured && role === 'LEAD') {
    return <Navigate to="/deliverables" replace />;
  }

  if (isUnconfigured) {
    return (
      <div className="dashboard-page">
        <PageHeader
          crumbs={[projectName, roleLabel]}
          title="Dashboard"
          rightSlot={<HeaderActions projectId={projectId} project={project} role={role} onProjectChange={setProjectHold} />}
        />
        <ProjectSetupNotice projectName={projectName} role={role} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        crumbs={[projectName, roleLabel]}
        title="Dashboard"
        rightSlot={<HeaderActions projectId={projectId} project={project} role={role} onProjectChange={setProjectHold} />}
      />
      <ProjectHoldBanner projectId={projectId} project={project} role={role} onProjectChange={setProjectHold} />

      <KpiCardRow
        key={`kpi-${projectId}-${projectOnHold ? 'hold' : 'active'}`}
        projectId={projectId}
        role={role}
        frozen={projectOnHold}
      />

      <div className="dashboard-page__row-2">
        <WorkflowFunnel
          projectId={projectId}
          selectedPhase={selectedPhase}
          onSelectPhase={setSelectedPhase}
        />
        <NeedsAttentionPanel
          key={`attention-${projectId}-${projectOnHold ? 'hold' : 'active'}`}
          projectId={projectId}
          role={role}
          projectOnHold={projectOnHold}
        />
      </div>

      <DeliverablesTable
        projectId={projectId}
        role={role}
        phaseFilter={selectedPhase}
      />
    </div>
  );
}

function HeaderActions({
  projectId,
  project,
  role,
  onProjectChange,
}: {
  projectId: string;
  project: Project | null;
  role: 'LEAD' | 'PM' | 'ENGINEER';
  onProjectChange: (project: Project) => void;
}) {
  return (
    <div className="dashboard-actions">
      <ProjectHoldButton projectId={projectId} project={project} role={role} onProjectChange={onProjectChange} />
      <SyncIndicator variant="pill" />
    </div>
  );
}
