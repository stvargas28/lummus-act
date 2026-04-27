import type { AttentionItem, InterventionLevel, Role } from '../../api/types';
import { NudgeButton } from '../shared/NudgeButton';
import './AttentionCard.css';

/**
 * Card accent by intervention_level (UI §5.1, MVP §9.7).
 *  PM_INTERVENTION → danger + ⚑ flag
 *  PM_AWARENESS    → lime
 *  LEAD_ACTION     → teal
 *  INFO            → muted
 */
const ACCENT_BY_LEVEL: Record<InterventionLevel, string> = {
  PM_INTERVENTION: '--color-danger',
  PM_AWARENESS: '--color-accent-lime',
  LEAD_ACTION: '--color-accent-teal',
  INFO: '--color-border',
};

interface AttentionCardProps {
  item: AttentionItem;
  role: Role;
}

export function AttentionCard({ item, role }: AttentionCardProps) {
  const accent = ACCENT_BY_LEVEL[item.intervention_level];
  const canNudge = role === 'LEAD' || role === 'PM';
  const isPmIntervention = item.intervention_level === 'PM_INTERVENTION';

  return (
    <article
      className={`attention-card ${isPmIntervention ? 'attention-card--pm-intervention' : ''}`}
      style={{ '--attn-accent': `var(${accent})` } as React.CSSProperties}
    >
      <div className="attention-card__body">
        <div className="attention-card__row1">
          {isPmIntervention && (
            <span
              className="attention-card__flag"
              aria-label="PM intervention required"
              title="PM intervention required"
            >
              ⚑
            </span>
          )}
          <span className="attention-card__ref mono">{item.document_reference}</span>
          <span className="attention-card__title" title={item.title}>{item.title}</span>
        </div>
        <div
          className="attention-card__reason"
          dangerouslySetInnerHTML={{ __html: item.reason_text }}
        />
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
