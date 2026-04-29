// Real API handlers — wired when the backend is ready.
// These mirror the mock handler signatures exactly so api/index.ts can swap with one line.

import type {
  AttentionItem,
  Deliverable,
  FunnelPhase,
  KpiCardData,
  PendingReview,
  Persona,
  Project,
  ProjectMember,
  SyncStatus,
} from '../types';

const NOT_WIRED = 'Real API not wired yet. Connect backend then update src/api/index.ts.';

export async function listProjects(): Promise<Project[]> { throw new Error(NOT_WIRED); }
export async function getProject(_id: string): Promise<Project> { throw new Error(NOT_WIRED); }
export async function listPersonas(): Promise<Persona[]> { throw new Error(NOT_WIRED); }
export async function getPersona(_id: string): Promise<Persona | null> { throw new Error(NOT_WIRED); }
export async function getProjectMembers(_id: string): Promise<ProjectMember[]> { throw new Error(NOT_WIRED); }
export async function getDeliverables(_id: string): Promise<Deliverable[]> { throw new Error(NOT_WIRED); }
export async function getKpiSummary(_id: string, _role: 'LEAD' | 'PM'): Promise<KpiCardData[]> { throw new Error(NOT_WIRED); }
export async function getFunnel(_id: string): Promise<FunnelPhase[]> { throw new Error(NOT_WIRED); }
export async function getNeedsAttention(_id: string): Promise<AttentionItem[]> { throw new Error(NOT_WIRED); }
export async function getSyncStatus(): Promise<SyncStatus> { throw new Error(NOT_WIRED); }
export async function getPendingReviewsForUser(_id: string, _userId: string): Promise<PendingReview[]> { throw new Error(NOT_WIRED); }
export async function nudge(_id: string, _recipientId: string): Promise<{ ok: true; sent_at: string }> { throw new Error(NOT_WIRED); }
export async function updateLeadNote(_id: string, _note: string | null): Promise<Deliverable> { throw new Error(NOT_WIRED); }
export async function updateEngineerProgress(_id: string, _pct: number | null): Promise<Deliverable> { throw new Error(NOT_WIRED); }
export async function updateDeliverableOwner(_id: string, _ownerUserId: string | null): Promise<Deliverable> { throw new Error(NOT_WIRED); }
