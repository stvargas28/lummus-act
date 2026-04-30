import type { Role } from '../../api/types';
import './ProjectSetupNotice.css';

interface ProjectSetupNoticeProps {
  projectName: string;
  role: Role;
}

export function ProjectSetupNotice({ projectName, role }: ProjectSetupNoticeProps) {
  const owner = role === 'PM' ? 'Lead' : 'project Lead';

  return (
    <section className="project-setup-notice" role="status" aria-live="polite">
      <div className="project-setup-notice__mark" aria-hidden="true">!</div>
      <div className="project-setup-notice__body">
        <span className="section-label">Project discovered</span>
        <h2 className="project-setup-notice__title">{projectName} is waiting for setup</h2>
        <p className="project-setup-notice__copy">
          The API account can see this project, but the deliverable table has not been uploaded yet.
          Once the {owner} seeds the register, dashboards, reviews, alerts, and My Work will unlock.
        </p>
      </div>
    </section>
  );
}
