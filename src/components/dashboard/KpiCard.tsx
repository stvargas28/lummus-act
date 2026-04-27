import type { KpiCardData } from '../../api/types';
import './KpiCard.css';

const ARROW: Record<KpiCardData['delta_direction'], string> = {
  up: '▲',
  down: '▼',
  flat: '—',
};

function deltaSemanticForDirection(card: KpiCardData): 'good' | 'bad' | 'neutral' {
  if (card.delta_direction === 'flat') return 'neutral';
  if (card.delta_semantic === 'positive') {
    return card.delta_direction === 'up' ? 'good' : 'bad';
  }
  if (card.delta_semantic === 'negative') {
    return card.delta_direction === 'up' ? 'bad' : 'good';
  }
  return 'neutral';
}

interface KpiCardProps {
  card: KpiCardData;
  loading?: boolean;
  /** Optional descriptor under the value, e.g. "of total" or "≤ 5 days remaining". */
  descriptor?: string;
}

export function KpiCard({ card, loading, descriptor }: KpiCardProps) {
  const tone = deltaSemanticForDirection(card);
  const value = card.value;
  return (
    <article
      className="kpi-card"
      style={{ '--kpi-accent': `var(${card.color_token})` } as React.CSSProperties}
      aria-busy={loading || undefined}
    >
      <div className="kpi-card__head">
        <span className="kpi-card__dot" aria-hidden="true" />
        <span className="kpi-card__label">{card.label}</span>
      </div>

      <div className="kpi-card__value mono">
        {loading || value === null ? <span className="kpi-card__placeholder">—</span> : formatValue(value)}
      </div>

      <div className="kpi-card__foot">
        <span className="kpi-card__descriptor">{descriptor ?? defaultDescriptor(card)}</span>
        {!loading && card.delta_count !== null && !card.key.startsWith('total') && (
          <span className={`kpi-card__delta kpi-card__delta--${tone}`}>
            <span className="kpi-card__delta-arrow" aria-hidden="true">{ARROW[card.delta_direction]}</span>
            <span className="kpi-card__delta-count mono">
              {formatDeltaCount(card.delta_count)}
            </span>
            <span className="kpi-card__delta-window">today</span>
          </span>
        )}
      </div>
    </article>
  );
}

function formatDeltaCount(n: number): string {
  if (n > 0) return `+${n}`;
  return `${n}`;
}

function formatValue(n: number): string {
  return n.toLocaleString('en-US');
}

function defaultDescriptor(card: KpiCardData): string {
  switch (card.key) {
    case 'total':
      return 'all phases';
    case 'on_track':
    case 'on_track_client':
      return 'of total';
    case 'at_risk':
      return '≤ 5 days remaining';
    case 'at_risk_client':
      return '≤ 7 days to client due';
    case 'overdue':
      return 'past internal due date';
    case 'overdue_client':
      return 'past client due date';
    default:
      return '';
  }
}
