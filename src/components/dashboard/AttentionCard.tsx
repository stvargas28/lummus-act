import type { ActPhase, AttentionItem, InterventionLevel, Role } from '../../api/types';
import { NudgeButton } from '../shared/NudgeButton';
import './AttentionCard.css';

const PM_ACCENT_BY_LEVEL: Record<InterventionLevel, string> = {
  PM_INTERVENTION: '--color-danger',
  PM_AWARENESS: '--color-warn-amber',
  LEAD_ACTION: '--color-primary',
  INFO: '--color-border',
};

const ACCENT_BY_SEVERITY: Record<AttentionItem['severity'], string> = {
  danger: '--color-danger',
  warning: '--color-warn-amber',
  info: '--color-primary',
};

const LABEL_BY_LEVEL: Record<InterventionLevel, string> = {
  PM_INTERVENTION: 'PM INTERVENTION',
  PM_AWARENESS: 'PM AWARENESS',
  LEAD_ACTION: 'LEAD ACTION',
  INFO: 'MONITOR',
};

const LABEL_BY_SEVERITY: Record<AttentionItem['severity'], string> = {
  danger: 'OVERDUE',
  warning: 'AT RISK',
  info: 'INFO',
};

const LABEL_BY_PHASE: Record<ActPhase, string> = {
  NOT_STARTED: 'NOT STARTED',
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'IN REVIEW',
  REVISING: 'REVISING',
  READY_FOR_ISSUE: 'READY FOR ISSUE',
  ISSUED: 'ISSUED',
};

interface AttentionCardProps {
  item: AttentionItem;
  role: Role;
}

export function AttentionCard({ item, role }: AttentionCardProps) {
  const accent = role === 'PM'
    ? PM_ACCENT_BY_LEVEL[item.intervention_level]
    : ACCENT_BY_SEVERITY[item.severity];
  const canNudge = role === 'LEAD' || role === 'PM';
  const isPmIntervention = item.intervention_level === 'PM_INTERVENTION';
  const label = role === 'PM' ? LABEL_BY_LEVEL[item.intervention_level] : LABEL_BY_SEVERITY[item.severity];

  return (
    <article
      className={`attention-card attention-card--${item.intervention_level.toLowerCase().replace('_', '-')} ${
        isPmIntervention ? 'attention-card--pm-intervention' : ''
      }`}
      style={{ '--attn-accent': `var(${accent})` } as React.CSSProperties}
    >
      <div className="attention-card__body">
        <div className="attention-card__topline">
          <span className="attention-card__ref mono">{item.document_reference}</span>
          <span className={`attention-card__phase attention-card__phase--${item.act_phase.toLowerCase().replaceAll('_', '-')}`}>
            {LABEL_BY_PHASE[item.act_phase]}
          </span>
          {isPmIntervention && role === 'PM' && (
            <span className="attention-card__flag" aria-label="PM intervention required">
              PM
            </span>
          )}
        </div>
        <div className="attention-card__title" title={item.title}>{item.title}</div>
        <div className="attention-card__why">
          <span className="attention-card__level">{label}</span>
          <span className="attention-card__dot">-</span>
          <span className="attention-card__reason">{item.reason_text}</span>
        </div>
      </div>
      <div className="attention-card__meta">
        <span className="attention-card__time mono">{item.time_indicator}</span>
        {canNudge && (
          <NudgeButton
            deliverableId={item.deliverable_id}
            recipientUserId={item.recipient_user_id}
            alreadyAlertedToday={item.already_alerted_today}
            lastAlertAt={item.last_alert_at}
          />
        )}
      </div>
    </article>
  );
}
