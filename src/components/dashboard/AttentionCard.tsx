import type { AttentionItem, Role } from '../../api/types';
import { NudgeButton } from '../shared/NudgeButton';
import './AttentionCard.css';

const ACCENT_BY_KIND: Record<AttentionItem['reason_kind'], string> = {
  PAST_CLIENT_DUE: '--color-danger',
  PAST_INTERNAL_DUE: '--color-danger',
  CLIENT_DUE_IMMINENT: '--color-danger',
  SINGLE_REVIEWER_STALL: '--color-accent-teal',
  CLIENT_DUE_NO_REVIEW: '--color-accent-lime',
  MULTI_REVIEWER_STALL: '--color-accent-teal',
  DRAFT_IDLE_NEAR_DUE: '--color-accent-lime',
};

interface AttentionCardProps {
  item: AttentionItem;
  role: Role;
}

export function AttentionCard({ item, role }: AttentionCardProps) {
  const accent = ACCENT_BY_KIND[item.reason_kind];
  const canNudge = role === 'LEAD' || role === 'PM';

  return (
    <article
      className="attention-card"
      style={{ '--attn-accent': `var(${accent})` } as React.CSSProperties}
    >
      <div className="attention-card__body">
        <div className="attention-card__row1">
          <span className="attention-card__ref mono">{item.document_reference}</span>
          <span className="attention-card__title" title={item.title}>{item.title}</span>
        </div>
        <div className="attention-card__reason"
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
