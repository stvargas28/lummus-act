import type { Role } from '../api/types';
import { useActiveMembership } from './useActiveMembership';

/**
 * Active role on the currently selected project. Returns null while the
 * persona/project pair is still resolving (during initial mount).
 */
export function useActiveRole(): Role | null {
  return useActiveMembership()?.role ?? null;
}
