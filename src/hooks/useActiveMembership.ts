import { useAuth } from './useAuth';
import { useProject } from './useProject';
import type { ProjectMembership } from '../api/types';

/**
 * Returns the active persona's membership for the currently selected project,
 * or null if either is unresolved.
 *
 * The active role for the running app is read off this membership — components
 * should never assume one global role.
 */
export function useActiveMembership(): ProjectMembership | null {
  const { persona } = useAuth();
  const { projectId } = useProject();
  if (!persona || !projectId) return null;
  return persona.memberships.find((m) => m.project_id === projectId) ?? null;
}
