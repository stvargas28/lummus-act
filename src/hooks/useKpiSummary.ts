import { getKpiSummary } from '../api';
import { useAsync } from './useAsync';

export function useKpiSummary(projectId: string, role: 'LEAD' | 'PM') {
  return useAsync(() => getKpiSummary(projectId, role), `kpi:${projectId}:${role}`);
}
