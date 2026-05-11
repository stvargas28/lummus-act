import * as seed from './seed';
import type {
  AlertHistoryItem,
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

export async function updateLeadNote(deliverableId: string, note: string | null): Promise<Deliverable> {
  return seed.updateLeadNote(deliverableId, note);
}

export async function updateEngineerProgress(deliverableId: string, percent: number | null): Promise<Deliverable> {
  return seed.updateEngineerProgress(deliverableId, percent);
}

export async function updateDeliverableOwner(deliverableId: string, ownerUserId: string | null): Promise<Deliverable> {
  return seed.updateDeliverableOwner(deliverableId, ownerUserId);
}

export async function updateProjectHold(projectId: string, active: boolean, userId: string): Promise<Project> {
  return seed.updateProjectHold(projectId, active, userId);
}

export async function updateDeliverableHold(deliverableId: string, active: boolean, userId: string): Promise<Deliverable> {
  return seed.updateDeliverableHold(deliverableId, active, userId);
}

export async function listProjects(): Promise<Project[]> {
  return seed.listProjects();
}

export async function listPersonas(): Promise<Persona[]> {
  return seed.listPersonas();
}

export async function getPersona(id: string): Promise<Persona | null> {
  return seed.getPersona(id);
}

export async function getProject(projectId: string): Promise<Project> {
  return seed.getProject(projectId);
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  return seed.getMembers(projectId);
}

export async function getDeliverables(projectId: string): Promise<Deliverable[]> {
  return seed.getDeliverables(projectId);
}

export async function getKpiSummary(projectId: string, role: 'LEAD' | 'PM'): Promise<KpiCardData[]> {
  return seed.getKpiSummary(projectId, role);
}

export async function getFunnel(projectId: string): Promise<FunnelPhase[]> {
  return seed.getFunnel(projectId);
}

export async function getNeedsAttention(projectId: string): Promise<AttentionItem[]> {
  return seed.getNeedsAttention(projectId);
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return seed.getSyncStatus();
}

export async function getPendingReviewsForUser(projectId: string, userId: string): Promise<PendingReview[]> {
  return seed.getPendingReviewsForUser(projectId, userId);
}

export async function nudge(
  _deliverableId: string,
  _recipientUserId: string,
): Promise<{ ok: true; sent_at: string }> {
  return { ok: true, sent_at: new Date().toISOString() };
}

export async function getAlertHistory(projectId: string): Promise<AlertHistoryItem[]> {
  return seed.getAlertHistory(projectId);
}
