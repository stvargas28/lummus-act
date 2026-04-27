import { listProjects } from '../api';
import { useAsync } from './useAsync';

export function useProjects() {
  return useAsync(() => listProjects(), 'projects');
}
