import braskemRaw from '../../data/braskem.json';
import shintechRaw from '../../data/shintech.json';
import type {
  ActPhase,
  AttentionItem,
  Deliverable,
  DeliverableReview,
  FunnelPhase,
  InterventionLevel,
  KpiCardData,
  PendingReview,
  Persona,
  Project,
  ProjectMember,
  ReviewRecipient,
  SyncStatus,
} from '../types';

// ---------- raw JSON shapes ----------

interface RawMatch {
  document_reference: string;
  title: string;
  source_row: number;
  ref_project_number: string;
  ref_document_type_code: string;
  ref_deliverable_number: string;
  match_status: 'matched' | 'unmatched' | 'needs_review';
  confidence: number;
  match_method: string | null;
  needs_lead_review: boolean;
  fusion_document_id: string | null;
  fusion_reference: string | null;
  fusion_title: string | null;
  fusion_pm_status: string | null;
  fusion_revision: string | null;
  internal_due: string | null;
  client_due: string | null;
  owner_source: string | null;
  owner_missing: boolean;
  notes: string[];
}

interface RawProject {
  metadata: { workspace: { id: string; name: string } };
  matches: RawMatch[];
}

const RAW: Record<string, RawProject> = {
  '361325': braskemRaw as RawProject,
  '363780': shintechRaw as RawProject,
};

// ---------- deterministic pseudo-random ----------

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand01(seed: string): number {
  return (hash(seed) % 10000) / 10000;
}

// ---------- date helpers ----------

const NOW = new Date();
const TODAY_ISO = NOW.toISOString().slice(0, 10);
// Source JSON contains dates from 2024–2025; today is 2026-04-25. Shift the
// source internal/client dates forward so the dashboard shows a realistic
// spread of approaching / imminent / overdue. Internal-vs-client gap is
// preserved because both columns receive the same shift.
const SOURCE_DATE_SHIFT_DAYS = 150;

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00Z');
}

function shiftSourceIso(iso: string | null): string | null {
  if (!iso) return null;
  const d = parseDate(iso)!;
  d.setUTCDate(d.getUTCDate() + SOURCE_DATE_SHIFT_DAYS);
  return d.toISOString().slice(0, 10);
}

function businessDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const cur = new Date(from);
  cur.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);
  const dir = cur <= end ? 1 : -1;
  while (cur.getTime() !== end.getTime()) {
    cur.setUTCDate(cur.getUTCDate() + dir);
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) count += dir;
  }
  return count;
}

function daysRemainingFrom(today: Date, dueIso: string | null): number | null {
  if (!dueIso) return null;
  const due = parseDate(dueIso)!;
  return businessDaysBetween(today, due);
}

function shiftIso(iso: string, days: number): string {
  const d = parseDate(iso)!;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- discipline inference ----------

const DISCIPLINE_BY_CODE: Record<string, string> = {
  DW: 'Drawing',
  SP: 'Specification',
  PR: 'Procedure',
  MT: 'Material',
  DS: 'Datasheet',
  LS: 'List',
  CL: 'Calculation',
};

function disciplineFor(code: string): string {
  return DISCIPLINE_BY_CODE[code] ?? 'General';
}

// ---------- members ----------

const BRASKEM_MEMBERS: ProjectMember[] = [
  { user_id: 'u-wr', display_name: 'Will Robinson', initials: 'WR', role: 'ENGINEER', email: 'will.robinson@lummus.com' },
  { user_id: 'u-mp', display_name: 'Maria Pereira', initials: 'MP', role: 'ENGINEER', email: 'maria.pereira@lummus.com' },
  { user_id: 'u-jt', display_name: 'Jacob Tan', initials: 'JT', role: 'ENGINEER', email: 'jacob.tan@lummus.com' },
  { user_id: 'u-rb', display_name: 'Rachel Bailey', initials: 'RB', role: 'ENGINEER', email: 'rachel.bailey@lummus.com' },
  { user_id: 'u-lead-bra', display_name: 'David Chen', initials: 'DC', role: 'LEAD', email: 'david.chen@lummus.com' },
  { user_id: 'u-pm-bra', display_name: 'Sara Okafor', initials: 'SO', role: 'PM', email: 'sara.okafor@lummus.com' },
];

const SHINTECH_MEMBERS: ProjectMember[] = [
  { user_id: 'u-edu', display_name: 'Eduardo Silva', initials: 'ES', role: 'ENGINEER', email: 'eduardo.silva@lummus.com' },
  { user_id: 'u-ajit', display_name: 'Ajit Rao', initials: 'AR', role: 'ENGINEER', email: 'ajit.rao@lummus.com' },
  { user_id: 'u-stephen', display_name: 'Stephen Vargas', initials: 'SV', role: 'ENGINEER', email: 'stephen.vargas@lummus.com' },
  { user_id: 'u-blake', display_name: 'Blake Nguyen', initials: 'BN', role: 'ENGINEER', email: 'blake.nguyen@lummus.com' },
  { user_id: 'u-lead-shi', display_name: 'Priya Shah', initials: 'PS', role: 'LEAD', email: 'priya.shah@lummus.com' },
  { user_id: 'u-pm-shi', display_name: 'Marcus Hale', initials: 'MH', role: 'PM', email: 'marcus.hale@lummus.com' },
];

const ALIAS_TABLE: Record<string, Record<string, string>> = {
  '361325': {
    WR: 'u-wr',
  },
  '363780': {
    Eduardo: 'u-edu',
    Ajit: 'u-ajit',
    Stephen: 'u-stephen',
    Blake: 'u-blake',
  },
};

const PROJECTS: Record<string, Project> = {
  '361325': {
    id: '361325',
    name: 'Braskem DCX Expansion',
    workspace_id: '361325',
    lead_user_id: 'u-lead-bra',
    pm_user_id: 'u-pm-bra',
  },
  '363780': {
    id: '363780',
    name: 'Shintech PEP-2',
    workspace_id: '363780',
    lead_user_id: 'u-lead-shi',
    pm_user_id: 'u-pm-shi',
  },
};

const MEMBERS: Record<string, ProjectMember[]> = {
  '361325': BRASKEM_MEMBERS,
  '363780': SHINTECH_MEMBERS,
};

function resolveOwner(projectId: string, ownerSource: string | null): ProjectMember | null {
  if (!ownerSource) return null;
  const aliases = ALIAS_TABLE[projectId] ?? {};
  const id = aliases[ownerSource];
  if (!id) return null;
  return MEMBERS[projectId].find((m) => m.user_id === id) ?? null;
}

// ---------- phase synthesis ----------

const PHASE_DESCRIPTIONS: Record<ActPhase, { label: string; description: string; color: string }> = {
  NOT_STARTED: { label: 'Not started', description: 'file not on FusionLive', color: '--color-border' },
  DRAFT: { label: 'Draft', description: 'uploaded, not yet in review', color: '--color-phase-draft' },
  UNDER_REVIEW: { label: 'In review', description: 'open review on latest revision', color: '--color-accent-teal' },
  REVISING: { label: 'Revising', description: 'comments returned, awaiting new revision', color: '--color-accent-lime' },
  READY_FOR_ISSUE: { label: 'Ready for issue', description: 'reviewed, awaiting issue', color: '--color-accent-seafoam' },
  ISSUED: { label: 'Issued', description: 'transmitted to client', color: '--color-accent-green' },
};

const ALL_PHASES: ActPhase[] = ['NOT_STARTED', 'DRAFT', 'UNDER_REVIEW', 'REVISING', 'READY_FOR_ISSUE', 'ISSUED'];

function synthesizePhase(raw: RawMatch): ActPhase {
  if (raw.match_status === 'unmatched') return 'NOT_STARTED';
  if (raw.fusion_pm_status === 'Issued') return 'ISSUED';
  // Distribute matched non-issued across remaining phases deterministically
  const r = rand01(raw.document_reference);
  if (r < 0.18) return 'DRAFT';
  if (r < 0.55) return 'UNDER_REVIEW';
  if (r < 0.78) return 'REVISING';
  if (r < 0.92) return 'READY_FOR_ISSUE';
  return 'ISSUED';
}

// ---------- review synthesis ----------

function synthesizeReview(
  projectId: string,
  raw: RawMatch,
  phase: ActPhase,
  bottleneckRefs: Set<string>,
): DeliverableReview | null {
  if (phase !== 'UNDER_REVIEW' && phase !== 'REVISING') return null;

  const project = PROJECTS[projectId];
  const members = MEMBERS[projectId];
  const lead = members.find((m) => m.user_id === project.lead_user_id);
  const pm = members.find((m) => m.user_id === project.pm_user_id);
  const engineers = members.filter((m) => m.role === 'ENGINEER');
  const seedBase = raw.document_reference;

  // Sent date: 2-12 business days ago
  const sentDaysAgo = 2 + (hash(seedBase + 'sent') % 11);
  const sentDate = new Date(NOW);
  sentDate.setUTCDate(sentDate.getUTCDate() - sentDaysAgo);
  const sentIso = sentDate.toISOString().slice(0, 10);
  const dueIso = shiftIso(sentIso, 10);

  const isBottleneck = bottleneckRefs.has(raw.document_reference);
  const engineerReviewerCount = isBottleneck ? 2 : 1 + (hash(seedBase + 'rcount') % 3);

  // PM and Lead are usually on the review, with engineers added by domain.
  const startIdx = hash(seedBase + 'start') % engineers.length;
  const domainReviewers = Array.from(
    { length: engineerReviewerCount },
    (_, i) => engineers[(startIdx + i) % engineers.length],
  );
  const reviewers = [pm, lead, ...domainReviewers].filter((m): m is ProjectMember => Boolean(m));

  // Comments: for bottleneck, all but one have responded; for normal review, half-ish
  const recipients: ReviewRecipient[] = reviewers.map((m, i) => {
    let responded: boolean;
    if (phase === 'REVISING') {
      // Closed-style: all responded with comments
      responded = true;
    } else if (isBottleneck) {
      responded = i !== reviewers.length - 1; // last reviewer is the holdout
    } else {
      responded = rand01(seedBase + 'r' + i) < 0.5;
    }
    return {
      user_id: m.user_id,
      display_name: m.display_name,
      initials: m.initials,
      is_for_information: false,
      responded,
      last_action_date: responded
        ? shiftIso(sentIso, 1 + (hash(seedBase + m.user_id) % 5))
        : null,
    };
  });

  const pendingActive = recipients.filter((r) => !r.is_for_information && !r.responded).length;

  // Idle time: for bottleneck, 3-6 business days; otherwise 1-3
  const idleDays = isBottleneck ? 3 + (hash(seedBase + 'idle') % 4) : 1 + (hash(seedBase + 'idle') % 3);
  const lastAuditIso = (() => {
    const d = new Date(NOW);
    let remaining = idleDays;
    while (remaining > 0) {
      d.setUTCDate(d.getUTCDate() - 1);
      const dow = d.getUTCDay();
      if (dow !== 0 && dow !== 6) remaining--;
    }
    return d.toISOString().slice(0, 10);
  })();

  const status = phase === 'REVISING' ? 'CLOSED' : 'OPEN';
  const closedDate = status === 'CLOSED' ? lastAuditIso : null;

  return {
    id: `rv-${raw.document_reference}`,
    status,
    sent_date: sentIso,
    due_date: dueIso,
    last_audit_date: lastAuditIso,
    closed_date: closedDate,
    recipients,
    pending_active_count: pendingActive,
    idle_business_days: idleDays,
  };
}

// ---------- engineer progress + lead note synthesis ----------

/**
 * Self-reported engineer progress, stepped 0/25/50/75/100 (UI §2.1).
 *
 * Rules:
 *  - No owner → null (nothing to attribute progress to).
 *  - NOT_STARTED → 0 (engineer hasn't picked it up).
 *  - ISSUED → 100 (work delivered).
 *  - Other phases → deterministic 25/50/75 based on doc reference hash so the
 *    distribution is realistic and stable across reloads.
 *
 * Note: this is context only — it does not affect overdue, alerts, or phase
 * (MVP §7).
 */
function synthesizeEngineerProgress(docRef: string, phase: ActPhase, hasOwner: boolean): number | null {
  if (!hasOwner) return null;
  if (phase === 'NOT_STARTED') return 0;
  if (phase === 'UNDER_REVIEW' || phase === 'READY_FOR_ISSUE' || phase === 'ISSUED') return 100;
  const r = hash(docRef + 'progress') % 3;
  if (phase === 'REVISING') return [0, 25, 50][r];
  return [25, 50, 75][r];
}

const SYNTHETIC_LEAD_NOTES = [
  'Waiting on Will to confirm coil dimensions before reissuing.',
  'Owner OOO this week — circle back Monday.',
  'PM agreed to push client due by 3 days; update in Excel re-upload.',
  'Reviewer keeps marking minor comments as substantive — flag in next 1:1.',
  'Earlier rev had open ProcessSafety comment; verify carried forward.',
];

/**
 * Lead/PM internal scratch note (MVP §7 / UI §4.5). About 1 in 8 deliverables
 * carries a synthetic note so the popover/icon UI exercises both states.
 * Empty (null) is the common case.
 */
function synthesizeLeadNote(docRef: string): string | null {
  const slot = hash(docRef + 'note') % 8;
  if (slot >= SYNTHETIC_LEAD_NOTES.length) return null;
  return SYNTHETIC_LEAD_NOTES[slot];
}

// ---------- intervention level (MVP §9.7) ----------

/**
 * Computes the intervention level for a flagged item per MVP §9.7
 * thresholds. Higher levels override lower.
 */
function computeInterventionLevel(d: Deliverable): InterventionLevel {
  const review = d.review;
  const idle = review?.idle_business_days ?? 0;
  const pending = review?.pending_active_count ?? 0;
  const open = review?.status === 'OPEN';
  const clientImminentInReview =
    d.act_phase === 'UNDER_REVIEW' &&
    d.days_remaining_client !== null &&
    d.days_remaining_client >= 0 &&
    d.days_remaining_client <= 3;

  // PM_INTERVENTION
  if ((open && idle >= 4) || clientImminentInReview) return 'PM_INTERVENTION';

  // Past client due is also an intervention-grade situation.
  if (d.act_phase !== 'ISSUED' && d.days_remaining_client !== null && d.days_remaining_client < 0) {
    return 'PM_INTERVENTION';
  }

  // PM_AWARENESS: review idle ≥ 3, OR (≥ 2 idle + already nudged today + no action)
  // We don't track per-deliverable nudge state in mock; the second clause is approximated
  // by deliverables synthesized as already_alerted_today on the attention card.
  if (open && idle >= 3) return 'PM_AWARENESS';

  // LEAD_ACTION: review idle ≥ 2 with at least one pending reviewer
  if (open && idle >= 2 && pending >= 1) return 'LEAD_ACTION';

  return 'INFO';
}

// ---------- bottleneck selection ----------

function selectBottleneckRefs(projectId: string, candidates: RawMatch[]): Set<string> {
  // Pick the first 1-2 matched records (deterministic) to be single-reviewer-stall bottlenecks
  const matched = candidates.filter((m) => m.match_status === 'matched' && m.fusion_pm_status !== 'Issued');
  const target = projectId === '361325' ? 1 : 2;
  return new Set(matched.slice(0, target).map((m) => m.document_reference));
}

// ---------- main: build deliverables ----------

interface ProjectData {
  project: Project;
  members: ProjectMember[];
  deliverables: Deliverable[];
}

const _cache: Record<string, ProjectData> = {};

function buildProject(projectId: string): ProjectData {
  if (_cache[projectId]) return _cache[projectId];

  const raw = RAW[projectId];
  if (!raw) throw new Error(`Unknown project ${projectId}`);

  const bottleneckRefs = selectBottleneckRefs(projectId, raw.matches);

  const deliverables: Deliverable[] = raw.matches.map((m) => {
    const phase = synthesizePhase(m);
    const owner = resolveOwner(projectId, m.owner_source);
    const review = synthesizeReview(projectId, m, phase, bottleneckRefs);

    const internalDue = shiftSourceIso(m.internal_due);
    const clientDue = shiftSourceIso(m.client_due);
    const internalDays = daysRemainingFrom(NOW, internalDue);
    const clientDays = daysRemainingFrom(NOW, clientDue);

    const isPastInternal = internalDays !== null && internalDays < 0;
    const isPastClient = clientDays !== null && clientDays < 0;
    const overdue = phase !== 'ISSUED' && (isPastInternal || isPastClient);

    return {
      id: `${projectId}-${m.document_reference}`,
      project_id: projectId,
      document_reference: m.document_reference,
      title: m.title,
      discipline: disciplineFor(m.ref_document_type_code),
      document_type_code: m.ref_document_type_code,
      owner_user_id: owner?.user_id ?? null,
      owner_display_name: owner?.display_name ?? null,
      internal_due: internalDue,
      client_due: clientDue,
      act_phase: phase,
      overdue_flag: overdue,
      fusion_document_id: m.fusion_document_id,
      fusion_pm_status: m.fusion_pm_status,
      fusion_revision: m.fusion_revision,
      match_status: m.match_status,
      needs_lead_review: m.needs_lead_review,
      review,
      days_remaining_internal: internalDays,
      days_remaining_client: clientDays,
      engineer_progress_percent: synthesizeEngineerProgress(m.document_reference, phase, owner !== null),
      lead_private_note: synthesizeLeadNote(m.document_reference),
    };
  });

  const data = {
    project: PROJECTS[projectId],
    members: MEMBERS[projectId],
    deliverables,
  };
  _cache[projectId] = data;
  return data;
}

// ---------- mutations (in-memory; overwrite cached deliverable fields) ----------

export function updateLeadNote(deliverableId: string, note: string | null): Deliverable {
  for (const pid of Object.keys(_cache)) {
    const d = _cache[pid].deliverables.find((x) => x.id === deliverableId);
    if (d) { d.lead_private_note = note; return d; }
  }
  throw new Error(`Deliverable ${deliverableId} not found`);
}

export function updateEngineerProgress(deliverableId: string, percent: number | null): Deliverable {
  for (const pid of Object.keys(_cache)) {
    const d = _cache[pid].deliverables.find((x) => x.id === deliverableId);
    if (d) { d.engineer_progress_percent = percent; return d; }
  }
  throw new Error(`Deliverable ${deliverableId} not found`);
}

export function updateDeliverableOwner(deliverableId: string, ownerUserId: string | null): Deliverable {
  for (const pid of Object.keys(_cache)) {
    const data = _cache[pid];
    const d = data.deliverables.find((x) => x.id === deliverableId);
    if (!d) continue;

    const owner = ownerUserId ? data.members.find((m) => m.user_id === ownerUserId) ?? null : null;
    d.owner_user_id = owner?.user_id ?? null;
    d.owner_display_name = owner?.display_name ?? null;
    if (d.owner_user_id === null) d.engineer_progress_percent = null;
    else if (d.engineer_progress_percent === null) d.engineer_progress_percent = 0;
    return d;
  }
  throw new Error(`Deliverable ${deliverableId} not found`);
}

// ---------- public surface ----------

export function getProject(projectId: string): Project {
  return buildProject(projectId).project;
}

export function getMembers(projectId: string): ProjectMember[] {
  return buildProject(projectId).members;
}

export function getDeliverables(projectId: string): Deliverable[] {
  return buildProject(projectId).deliverables;
}

export function listProjects(): Project[] {
  return Object.values(PROJECTS);
}

// ---------- personas ----------

// Personas exercise multi-project membership cases:
// - Lead with two projects (different role potential)
// - PM with two projects
// - Engineer with two projects (proves engineers also see project switcher)
// - Engineer on a single project (proves switcher disappears)
// - Hybrid: Lead on Braskem, Engineer on Shintech (proves role changes per project)
const PERSONAS: Persona[] = [
  {
    id: 'persona-lead-multi',
    user_id: 'u-lead-bra',
    display_name: 'David Chen',
    initials: 'DC',
    email: 'david.chen@lummus.com',
    memberships: [
      { project_id: '361325', role: 'LEAD' },
      { project_id: '363780', role: 'LEAD' },
    ],
  },
  {
    id: 'persona-pm-multi',
    user_id: 'u-pm-bra',
    display_name: 'Sara Okafor',
    initials: 'SO',
    email: 'sara.okafor@lummus.com',
    memberships: [
      { project_id: '361325', role: 'PM' },
      { project_id: '363780', role: 'PM' },
    ],
  },
  {
    id: 'persona-engineer-multi',
    user_id: 'u-wr',
    display_name: 'Will Robinson',
    initials: 'WR',
    email: 'will.robinson@lummus.com',
    memberships: [
      { project_id: '361325', role: 'ENGINEER' },
      { project_id: '363780', role: 'ENGINEER' },
    ],
  },
  {
    id: 'persona-engineer-single',
    user_id: 'u-edu',
    display_name: 'Eduardo Silva',
    initials: 'ES',
    email: 'eduardo.silva@lummus.com',
    memberships: [{ project_id: '363780', role: 'ENGINEER' }],
  },
  {
    id: 'persona-hybrid',
    user_id: 'u-mp',
    display_name: 'Maria Pereira',
    initials: 'MP',
    email: 'maria.pereira@lummus.com',
    memberships: [
      { project_id: '361325', role: 'LEAD' },
      { project_id: '363780', role: 'ENGINEER' },
    ],
  },
];

export function listPersonas(): Persona[] {
  return PERSONAS;
}

export function getPersona(id: string): Persona | null {
  return PERSONAS.find((p) => p.id === id) ?? null;
}

// ---------- KPI summary ----------

export function getKpiSummary(projectId: string, role: 'LEAD' | 'PM'): KpiCardData[] {
  const dels = getDeliverables(projectId);
  const total = dels.length;
  const nonIssued = dels.filter((d) => d.act_phase !== 'ISSUED');

  if (role === 'LEAD') {
    const overdue = dels.filter(
      (d) => d.act_phase !== 'ISSUED' &&
        ((d.days_remaining_internal !== null && d.days_remaining_internal < 0) ||
         (d.days_remaining_client !== null && d.days_remaining_client < 0)),
    ).length;
    const atRisk = nonIssued.filter((d) => {
      const i = d.days_remaining_internal;
      return i !== null && i >= 0 && i <= 5;
    }).length;
    const onTrack = total - overdue - atRisk;
    return [
      kpi('total', 'Total Deliverables', total, 0, 'flat', 'neutral', '--color-primary'),
      kpi('on_track', 'On Track', onTrack, 4, 'up', 'positive', '--color-accent-green'),
      kpi('at_risk', 'At Risk', atRisk, Math.min(1, atRisk), atRisk > 0 ? 'up' : 'flat', 'negative', '--color-warn-amber'),
      kpi('overdue', 'Overdue', overdue, Math.min(2, overdue), overdue > 0 ? 'up' : 'flat', 'negative', '--color-danger'),
    ];
  }

  // PM
  const overdueClient = dels.filter(
    (d) => d.act_phase !== 'ISSUED' && d.days_remaining_client !== null && d.days_remaining_client < 0,
  ).length;
  const atRiskClient = nonIssued.filter((d) => {
    const c = d.days_remaining_client;
    return c !== null && c >= 0 && c <= 7;
  }).length;
  const onTrackClient = total - overdueClient - atRiskClient;
  return [
    kpi('total', 'Total Deliverables', total, 0, 'flat', 'neutral', '--color-primary'),
    kpi('on_track_client', 'On Track vs Client Due', onTrackClient, 3, 'up', 'positive', '--color-accent-green'),
    kpi('at_risk_client', 'At Risk of Client Due', atRiskClient, atRiskClient > 0 ? 1 : -2, atRiskClient > 0 ? 'up' : 'down', 'negative', '--color-warn-amber'),
    kpi('overdue_client', 'Overdue vs Client Due', overdueClient, Math.min(2, overdueClient), overdueClient > 0 ? 'up' : 'flat', 'negative', '--color-danger'),
  ];
}

function kpi(
  key: string,
  label: string,
  value: number,
  delta: number,
  dir: 'up' | 'down' | 'flat',
  semantic: 'positive' | 'negative' | 'neutral',
  color: string,
): KpiCardData {
  return {
    key,
    label,
    value,
    delta_count: delta,
    delta_direction: dir,
    delta_semantic: semantic,
    color_token: color,
  };
}

// ---------- Funnel ----------

export function getFunnel(projectId: string): FunnelPhase[] {
  const dels = getDeliverables(projectId);
  const total = dels.length || 1;
  return ALL_PHASES.map((phase) => {
    const count = dels.filter((d) => d.act_phase === phase).length;
    const meta = PHASE_DESCRIPTIONS[phase];
    return {
      phase,
      label: meta.label,
      description: meta.description,
      count,
      proportion: count / total,
      color_token: meta.color,
    };
  });
}

// ---------- Needs Attention ----------

export function getNeedsAttention(projectId: string): AttentionItem[] {
  const dels = getDeliverables(projectId);
  const items: AttentionItem[] = [];

  for (const d of dels) {
    if (d.act_phase === 'ISSUED') continue;

    const clientLate = d.days_remaining_client !== null && d.days_remaining_client < 0;
    const internalLate = d.days_remaining_internal !== null && d.days_remaining_internal < 0;
    const clientImminent = d.days_remaining_client !== null && d.days_remaining_client >= 0 && d.days_remaining_client <= 3;
    const clientNoReviewSoon =
      d.days_remaining_client !== null &&
      d.days_remaining_client >= 0 &&
      d.days_remaining_client <= 7 &&
      (d.act_phase === 'NOT_STARTED' || d.act_phase === 'DRAFT');

    if (clientLate) {
      items.push(buildItem(d, 'PAST_CLIENT_DUE', `Client due ${Math.abs(d.days_remaining_client!)} business days ago`,
        `${Math.abs(d.days_remaining_client!)} DAYS LATE`, 'danger', 'CLIENT_RISK'));
      continue;
    }
    if (internalLate) {
      items.push(buildItem(d, 'PAST_INTERNAL_DUE', `${Math.abs(d.days_remaining_internal!)} days past internal due — no review started`,
        `${Math.abs(d.days_remaining_internal!)} DAYS LATE`, 'danger', 'INTERNAL'));
      continue;
    }
    if (clientImminent && d.act_phase !== 'READY_FOR_ISSUE') {
      items.push(buildItem(d, 'CLIENT_DUE_IMMINENT', `Client due in ${d.days_remaining_client} days — still ${humanPhase(d.act_phase)}`,
        `${d.days_remaining_client} DAYS LEFT`, 'danger', 'CLIENT_RISK'));
      continue;
    }
    if (d.review && d.review.status === 'OPEN' && d.review.pending_active_count === 1 && d.review.idle_business_days >= 2) {
      const pending = d.review.recipients.find((r) => !r.is_for_information && !r.responded);
      const name = pending?.display_name ?? 'reviewer';
      items.push({
        deliverable_id: d.id,
        document_reference: d.document_reference,
        title: d.title,
        reason_kind: 'SINGLE_REVIEWER_STALL',
        reason_text: `Last reviewer. ${name} hasn't acted in ${d.review.idle_business_days} days`,
        time_indicator: `${d.review.idle_business_days} DAYS IDLE`,
        severity: 'warning',
        category: 'INTERNAL',
        recipient_user_id: pending?.user_id ?? null,
        already_alerted_today: rand01(d.id + 'alert') < 0.4,
        last_alert_at: rand01(d.id + 'alert') < 0.4 ? new Date(NOW.getTime() - 1000 * 60 * 60 * 3).toISOString() : null,
        intervention_level: computeInterventionLevel(d),
      });
      continue;
    }
    if (clientNoReviewSoon) {
      items.push(buildItem(d, 'CLIENT_DUE_NO_REVIEW', `Client due in ${d.days_remaining_client} days — no review started`,
        `${d.days_remaining_client} DAYS LEFT`, 'warning', 'CLIENT_RISK'));
      continue;
    }
    if (d.review && d.review.status === 'OPEN' && d.review.pending_active_count >= 2 && d.review.idle_business_days >= 2) {
      items.push({
        deliverable_id: d.id,
        document_reference: d.document_reference,
        title: d.title,
        reason_kind: 'MULTI_REVIEWER_STALL',
        reason_text: `${d.review.pending_active_count} reviewers pending — idle ${d.review.idle_business_days} days`,
        time_indicator: `${d.review.idle_business_days} DAYS IDLE`,
        severity: 'info',
        category: 'INTERNAL',
        recipient_user_id: null,
        already_alerted_today: false,
        last_alert_at: null,
        intervention_level: computeInterventionLevel(d),
      });
    }
  }

  // Sort: intervention_level descending (PM_INTERVENTION on top regardless of
  // category — UI §5.2 + MVP §9.7), then within each level by reason kind
  // severity. The Needs Attention panel additionally separates client-risk vs
  // internal in PM view, but base ordering is identical for both roles.
  const levelRank: Record<InterventionLevel, number> = {
    PM_INTERVENTION: 0,
    PM_AWARENESS: 1,
    LEAD_ACTION: 2,
    INFO: 3,
  };
  const reasonRank: Record<AttentionItem['reason_kind'], number> = {
    PAST_CLIENT_DUE: 0,
    CLIENT_DUE_IMMINENT: 1,
    SINGLE_REVIEWER_STALL: 2,
    PAST_INTERNAL_DUE: 3,
    CLIENT_DUE_NO_REVIEW: 4,
    MULTI_REVIEWER_STALL: 5,
    DRAFT_IDLE_NEAR_DUE: 6,
  };
  items.sort((a, b) => {
    const lvl = levelRank[a.intervention_level] - levelRank[b.intervention_level];
    if (lvl !== 0) return lvl;
    return reasonRank[a.reason_kind] - reasonRank[b.reason_kind];
  });
  return items;
}

function buildItem(
  d: Deliverable,
  kind: AttentionItem['reason_kind'],
  text: string,
  time: string,
  severity: AttentionItem['severity'],
  category: AttentionItem['category'],
): AttentionItem {
  return {
    deliverable_id: d.id,
    document_reference: d.document_reference,
    title: d.title,
    reason_kind: kind,
    reason_text: text,
    time_indicator: time,
    severity,
    category,
    recipient_user_id: d.owner_user_id,
    already_alerted_today: rand01(d.id + 'alert') < 0.3,
    last_alert_at: rand01(d.id + 'alert') < 0.3 ? new Date(NOW.getTime() - 1000 * 60 * 60 * 5).toISOString() : null,
    intervention_level: computeInterventionLevel(d),
  };
}

function humanPhase(p: ActPhase): string {
  return PHASE_DESCRIPTIONS[p].label.toLowerCase();
}

// ---------- Sync status ----------

export function getSyncStatus(): SyncStatus {
  const minutes = 4;
  return {
    state: 'synced',
    last_synced_at: new Date(NOW.getTime() - minutes * 60 * 1000).toISOString(),
    minutes_since_sync: minutes,
  };
}

// ---------- Pending reviews (engineer view) ----------

export function getPendingReviewsForUser(projectId: string, userId: string): PendingReview[] {
  const dels = getDeliverables(projectId);
  const out: PendingReview[] = [];
  for (const d of dels) {
    if (!d.review || d.review.status !== 'OPEN') continue;
    const me = d.review.recipients.find((r) => r.user_id === userId);
    if (!me || me.responded || me.is_for_information) continue;
    const sent = parseDate(d.review.sent_date)!;
    const days = businessDaysBetween(sent, NOW);
    out.push({
      deliverable_id: d.id,
      document_reference: d.document_reference,
      title: d.title,
      originator_display_name: d.owner_display_name ?? 'Unknown',
      sent_date: d.review.sent_date,
      days_since_sent: days,
      review_due_date: d.review.due_date,
    });
  }
  return out;
}

export const __TODAY = TODAY_ISO;
