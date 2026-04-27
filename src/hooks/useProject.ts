import { useContext } from 'react';
import { ProjectContext } from '../contexts/project-context';

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be inside ProjectProvider');
  return ctx;
}
