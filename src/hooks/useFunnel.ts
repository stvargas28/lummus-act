import { getFunnel } from '../api';
import { useAsync } from './useAsync';

export function useFunnel(projectId: string) {
  return useAsync(() => getFunnel(projectId), `funnel:${projectId}`);
}
