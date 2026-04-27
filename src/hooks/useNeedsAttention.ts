import { getNeedsAttention } from '../api';
import { useAsync } from './useAsync';

export function useNeedsAttention(projectId: string) {
  return useAsync(() => getNeedsAttention(projectId), `needs-attention:${projectId}`);
}
