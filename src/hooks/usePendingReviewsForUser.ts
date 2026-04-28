import { getPendingReviewsForUser } from '../api';
import { useAsync } from './useAsync';

export function usePendingReviewsForUser(projectId: string, userId: string | null) {
  return useAsync(
    async () => {
      if (!userId) return [];
      return getPendingReviewsForUser(projectId, userId);
    },
    `${projectId}:${userId}`,
  );
}
