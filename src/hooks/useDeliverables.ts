import { getDeliverables } from '../api';
import { useAsync } from './useAsync';

export function useDeliverables(projectId: string) {
  return useAsync(() => getDeliverables(projectId), `deliverables:${projectId}`);
}
