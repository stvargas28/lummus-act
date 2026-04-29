import { getProjectMembers } from '../api';
import { useAsync } from './useAsync';

export function useProjectMembers(projectId: string) {
  return useAsync(() => getProjectMembers(projectId), `project-members:${projectId}`);
}
