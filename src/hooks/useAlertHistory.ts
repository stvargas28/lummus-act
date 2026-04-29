import { getAlertHistory } from '../api';
import { useAsync } from './useAsync';

export function useAlertHistory(projectId: string) {
  return useAsync(
    async () => {
      if (!projectId) return [];
      return getAlertHistory(projectId);
    },
    `alert-history:${projectId}`,
  );
}
