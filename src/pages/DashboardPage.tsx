import { useState } from 'react';
import { useActiveRole } from '../hooks/useActiveRole';
import { useProject } from '../hooks/useProject';
import { useProjects } from '../hooks/useProjects';
import { KpiCardRow } from '../components/dashboard/KpiCardRow';
import { WorkflowFunnel } from '../components/dashboard/WorkflowFunnel';
import { NeedsAttentionPanel } from '../components/dashboard/NeedsAttentionPanel';
import { DeliverablesTable } from '../components/deliverables/DeliverablesTable';
import { PageHeader } from '../components/layout/PageHeader';
import type { ActPhase } from '../api/types';
import './DashboardPage.css';

export function DashboardPage() {
  const role = useActiveRole();
  const { projectId } = useProject();
  const projects = useProjects();
  const [selectedPhase, setSelectedPhase] = useState<ActPhase | null>(null);

  if (!projectId || !role || (role !== 'LEAD' && role !== 'PM')) {
    return null;
  }

  const projectName = projects.data?.find((p) => p.id === projectId)?.name ?? projectId;
  const roleLabel = role === 'PM' ? 'PM' : 'Lead';

  return (
    <div className="dashboard-page">
      <PageHeader
        crumbs={[projectName, roleLabel]}
        title="Dashboard"
      />
      <KpiCardRow projectId={projectId} role={role} />

      <div className="dashboard-page__row-2">
        <WorkflowFunnel
          projectId={projectId}
          selectedPhase={selectedPhase}
          onSelectPhase={setSelectedPhase}
        />
        <NeedsAttentionPanel projectId={projectId} role={role} />
      </div>

      <DeliverablesTable
        projectId={projectId}
        role={role}
        phaseFilter={selectedPhase}
      />
    </div>
  );
}
