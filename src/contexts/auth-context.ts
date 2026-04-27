import { createContext } from 'react';
import type { Persona } from '../api/types';

export interface AuthContextValue {
  persona: Persona | null;
  setPersonaId: (id: string) => void;
  personas: Persona[];
}

export const AuthContext = createContext<AuthContextValue | null>(null);
export const PERSONA_STORAGE_KEY = 'act:devPersonaId';
