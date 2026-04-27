import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { listProjects } from '../api';
import type { Project } from '../api/types';
import { ProjectContext, PROJECT_STORAGE_KEY } from './project-context';

function readInitialId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(PROJECT_STORAGE_KEY);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { persona } = useAuth();
  const { push } = useToast();

  const [storedProjectId, setStoredProjectIdState] = useState<string | null>(readInitialId);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    listProjects().then((list) => {
      if (!cancelled) setAllProjects(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive the effective (validated) project id during render. Falls back to
  // the first membership project when the stored id is not in the active
  // persona's memberships. Stored id is preserved as-is — corrected on
  // explicit user action only.
  const memberIds = persona?.memberships.map((m) => m.project_id) ?? [];
  const effectiveProjectId =
    storedProjectId && memberIds.includes(storedProjectId)
      ? storedProjectId
      : memberIds[0] ?? null;

  // Persist effective id (so a reload starts with a valid project).
  useEffect(() => {
    if (effectiveProjectId) localStorage.setItem(PROJECT_STORAGE_KEY, effectiveProjectId);
  }, [effectiveProjectId]);

  // Toast on automatic fallback. Fires only when a *previously selected* id
  // becomes invalid against the new persona — not on first mount.
  const lastEffectiveRef = useRef<string | null>(null);
  useEffect(() => {
    const wasUserSelection = storedProjectId !== null;
    const wasRedirected = wasUserSelection && storedProjectId !== effectiveProjectId;
    const isNewTransition = lastEffectiveRef.current !== effectiveProjectId;
    if (wasRedirected && isNewTransition && allProjects.length > 0 && effectiveProjectId) {
      const name = allProjects.find((p) => p.id === effectiveProjectId)?.name ?? effectiveProjectId;
      push(`Switched to ${name}.`, 'info');
    }
    lastEffectiveRef.current = effectiveProjectId;
  }, [effectiveProjectId, storedProjectId, allProjects, push]);

  return (
    <ProjectContext.Provider
      value={{ projectId: effectiveProjectId, setProjectId: setStoredProjectIdState }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
