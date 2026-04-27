import { createContext } from 'react';

export interface ProjectContextValue {
  projectId: string | null;
  setProjectId: (id: string) => void;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);
export const PROJECT_STORAGE_KEY = 'act:projectId';
