import { useEffect, useState, type ReactNode } from 'react';
import { listPersonas } from '../api';
import { AuthContext, PERSONA_STORAGE_KEY } from './auth-context';
import type { Persona } from '../api/types';

const DEFAULT_PERSONA_ID = 'persona-lead-multi';

function readInitialId(): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(PERSONA_STORAGE_KEY) : null;
  return stored ?? DEFAULT_PERSONA_ID;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [storedPersonaId, setStoredPersonaIdState] = useState<string>(readInitialId);

  // Load persona list once on mount.
  useEffect(() => {
    let cancelled = false;
    listPersonas().then((list) => {
      if (!cancelled) setPersonas(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive the effective persona during render. If the stored id is not in
  // the loaded list, fall back to the first available persona. We never mutate
  // state inside an effect to "correct" a stored id — the user's pick survives
  // until they explicitly choose a different one via setPersonaId.
  const persona = personas.find((p) => p.id === storedPersonaId) ?? personas[0] ?? null;

  // Persist whatever the effective persona resolves to so reloads stay coherent.
  useEffect(() => {
    if (persona) localStorage.setItem(PERSONA_STORAGE_KEY, persona.id);
  }, [persona]);

  const setPersonaId = (id: string) => setStoredPersonaIdState(id);

  return (
    <AuthContext.Provider value={{ persona, setPersonaId, personas }}>{children}</AuthContext.Provider>
  );
}
