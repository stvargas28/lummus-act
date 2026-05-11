export type Role = 'LEAD' | 'PM' | 'ENGINEER';

/**
 * MVP phase enum (ACT MVP Spec v5 §4).
 *
 * NOTE: Post-issue phases (`CLIENT_COMMENTS_RECEIVED`, `REVISING_PER_CLIENT`,
 * `CLIENT_RESPONSE_SUBMITTED`, `APPROVED_BY_CLIENT` — see MVP §18) are
 * deferred. Do not extend this enum yet, but do not assume `ISSUED` is the
 * permanent terminal state for row styling, table architecture, or color
 * tokens (UI Spec §13.6).
 */
export type ActPhase =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'REVISING'
  | 'READY_FOR_ISSUE'
  | 'ISSUED';

/**
 * Intervention level (MVP §9.7). Computed per flagged item; drives card
 * accent color, ⚑ icon, and PM Needs Attention panel ordering.
 */
export type InterventionLevel = 'INFO' | 'LEAD_ACTION' | 'PM_AWARENESS' | 'PM_INTERVENTION';

export type ReviewStatus = 'OPEN' | 'CLOSED';

export type SyncState = 'synced' | 'syncing' | 'stale' | 'error';

export type AttentionReasonKind =
  | 'PAST_CLIENT_DUE'
  | 'PAST_INTERNAL_DUE'
  | 'CLIENT_DUE_IMMINENT'
  | 'SINGLE_REVIEWER_STALL'
  | 'CLIENT_DUE_NO_REVIEW'
  | 'MULTI_REVIEWER_STALL'
  | 'DRAFT_IDLE_NEAR_DUE';

export interface ProjectMember {
  user_id: string;
  display_name: string;
  initials: string;
  role: Role | 'OBSERVER';
  email: string;
}

export interface ProjectMembership {
  project_id: string;
  role: Role;
}

export interface Persona {
  id: string;
  user_id: string;
  display_name: string;
  initials: string;
  email: string;
  memberships: ProjectMembership[];
}

export interface Project {
  id: string;
  name: string;
  workspace_id: string;
  lead_user_id: string;
  pm_user_id: string;
  hold_active: boolean;
  hold_set_at: string | null;
  hold_set_by: string | null;
}

export interface ReviewRecipient {
  user_id: string;
  display_name: string;
  initials: string;
  is_for_information: boolean;
  responded: boolean;
  last_action_date: string | null;
}

export interface DeliverableReview {
  id: string;
  status: ReviewStatus;
  sent_date: string;
  due_date: string;
  last_audit_date: string;
  closed_date: string | null;
  recipients: ReviewRecipient[];
  pending_active_count: number;
  idle_business_days: number;
}

export interface Deliverable {
  id: string;
  project_id: string;
  document_reference: string;
  title: string;
  discipline: string;
  document_type_code: string;
  owner_user_id: string | null;
  owner_display_name: string | null;
  internal_due: string | null;
  client_due: string | null;
  act_phase: ActPhase;
  overdue_flag: boolean;
  fusion_document_id: string | null;
  fusion_pm_status: string | null;
  fusion_revision: string | null;
  match_status: 'matched' | 'unmatched' | 'needs_review';
  needs_lead_review: boolean;
  is_3d_model: boolean;
  hold_active: boolean;
  hold_set_at: string | null;
  hold_set_by: string | null;
  completeness_phase_proxy: number;
  review_cycle_count: number;
  review: DeliverableReview | null;
  days_remaining_internal: number | null;
  days_remaining_client: number | null;

  /**
   * Self-reported progress for the current engineer action cycle, 0-100,
   * stepped 0/25/50/75/100 in the MVP control. Editable only by the assigned
   * engineer from My Work. It resets when work comes back for revision, and
   * locks as complete while the item is in review/ready/issued. Visible to all
   * roles. Does NOT drive ACT phase, overdue flag, or alert triggers - context
   * only (MVP §7, UI §2.1).
   */
  engineer_progress_percent: number | null;

  /**
   * Lead/PM informal internal scratch note, single current value, overwritten
   * in place. No formal audit, no alert trigger (MVP §7, UI §4.5). Engineers
   * never see this.
   */
  lead_private_note: string | null;
}

export interface AttentionItem {
  deliverable_id: string;
  document_reference: string;
  title: string;
  act_phase: ActPhase;
  reason_kind: AttentionReasonKind;
  reason_text: string;
  time_indicator: string;
  severity: 'danger' | 'warning' | 'info';
  category: 'CLIENT_RISK' | 'INTERNAL';
  recipient_user_id: string | null;
  already_alerted_today: boolean;
  last_alert_at: string | null;
  /**
   * Computed escalation level (MVP §9.7). Drives card accent color, the ⚑
   * flag in PM_INTERVENTION, and panel ordering — PM_INTERVENTION sorts to
   * the top regardless of category.
   */
  intervention_level: InterventionLevel;
}

export interface KpiCardData {
  key: string;
  label: string;
  value: number | null;
  delta_count: number | null;
  delta_direction: 'up' | 'down' | 'flat';
  delta_semantic: 'positive' | 'negative' | 'neutral';
  color_token: string;
}

export interface FunnelPhase {
  phase: ActPhase;
  label: string;
  description: string;
  count: number;
  proportion: number;
  color_token: string;
}

export interface SyncStatus {
  state: SyncState;
  last_synced_at: string;
  minutes_since_sync: number;
}

export interface PendingReview {
  deliverable_id: string;
  document_reference: string;
  title: string;
  originator_display_name: string;
  sent_date: string;
  days_since_sent: number;
  review_due_date: string;
}

export type AlertHistorySource = 'AUTO' | 'MANUAL';
export type AlertHistoryStatus = 'OPEN' | 'RESOLVED' | 'FAILED';
export type AlertHistoryEngagement = 'SENT' | 'ACKNOWLEDGED' | 'ACTION_CLICKED';

/**
 * One entry in the Alert History log (MVP §9.8, UI §2.5).
 * Represents a fired alert, manual nudge, or Teams card interaction.
 * This is a history record — it does not imply an action is required.
 */
export interface AlertHistoryItem {
  id: string;
  project_id: string;
  created_at: string;
  alert_type: string;
  alert_type_label: string;
  deliverable_id: string | null;
  document_reference: string | null;
  title: string | null;
  recipient_user_id: string | null;
  recipient_display_name: string;
  trigger_text: string;
  source: AlertHistorySource;
  source_display_name: string | null;
  engagement: AlertHistoryEngagement;
  acknowledged_at: string | null;
  primary_action_clicked_at: string | null;
  status: AlertHistoryStatus;
  resolved_at: string | null;
  resolution_reason: string | null;
  view_url: string | null;
}
