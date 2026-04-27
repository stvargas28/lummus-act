import { getSyncStatus } from '../api';
import { useAsync } from './useAsync';

export function useSyncStatus() {
  return useAsync(() => getSyncStatus(), 'sync-status');
}
