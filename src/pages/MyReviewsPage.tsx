import { useMemo, useState } from 'react';
import type { PendingReview } from '../api/types';
import { useActiveRole } from '../hooks/useActiveRole';
import { useAuth } from '../hooks/useAuth';
import { usePendingReviewsForUser } from '../hooks/usePendingReviewsForUser';
import { useProject } from '../hooks/useProject';
import { PageHeader } from '../components/layout/PageHeader';
import './MyReviewsPage.css';

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

export function MyReviewsPage() {
  const role = useActiveRole();
  const { persona } = useAuth();
  const { projectId } = useProject();
  const [query, setQuery] = useState('');
  const reviews = usePendingReviewsForUser(projectId ?? '', persona?.user_id ?? null);

  const rows = useMemo(
    () => filterAndSortReviews(reviews.data ?? [], query),
    [reviews.data, query],
  );
  const stats = useMemo(() => buildReviewStats(reviews.data ?? []), [reviews.data]);

  if (!projectId || !role || !persona) {
    return null;
  }

  if (reviews.error) {
    return (
      <div className="reviews-page">
        <PageHeader crumbs={[persona.display_name, roleLabel(role)]} title="My Reviews" />
        <div className="reviews-error" role="alert">
          Failed to load reviews: {reviews.error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <PageHeader crumbs={[persona.display_name, roleLabel(role)]} title="My Reviews" />

      <section className="reviews-summary" aria-label="Review summary">
        <ReviewMetric label="Assigned to me" value={stats.total} />
        <ReviewMetric label="2+ days waiting" value={stats.waitingTwoPlus} tone={stats.waitingTwoPlus > 0 ? 'warn' : 'neutral'} />
        <ReviewMetric label="4+ days waiting" value={stats.waitingFourPlus} tone={stats.waitingFourPlus > 0 ? 'danger' : 'neutral'} />
        <ReviewMetric label="Longest wait" value={stats.oldestDays} suffix="days" />
      </section>

      <section className="reviews-panel" aria-label="Assigned reviews">
        <div className="reviews-panel__toolbar">
          <div>
            <span className="section-label">Assigned Reviews</span>
            <h2 className="reviews-panel__title">Waiting on My Response</h2>
          </div>
          <div className="reviews-search">
            <span className="reviews-search__icon" aria-hidden="true">⌕</span>
            <input
              className="reviews-search__input"
              type="search"
              placeholder="Filter by ref or title..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filter assigned reviews"
            />
          </div>
        </div>

        <div className="reviews-table-wrap">
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Doc Ref</th>
                <th>Title</th>
                <th>Sent for Review</th>
                <th>Waiting</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {reviews.loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`} className="reviews-table__loading">
                    <td colSpan={5}>
                      <div className="reviews-skeleton" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td className="reviews-empty" colSpan={5}>
                    No assigned reviews need your response right now.
                  </td>
                </tr>
              ) : (
                rows.map((review) => <ReviewRow key={review.deliverable_id} review={review} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ReviewMetric({
  label,
  value,
  suffix,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: 'neutral' | 'warn' | 'danger';
}) {
  return (
    <div className={`reviews-metric reviews-metric--${tone}`}>
      <span className="reviews-metric__label">{label}</span>
      <span className="reviews-metric__value">
        {value}
        {suffix && <span className="reviews-metric__suffix"> {suffix}</span>}
      </span>
    </div>
  );
}

function ReviewRow({ review }: { review: PendingReview }) {
  const needsAttention = review.days_since_sent >= 4;
  const warmingUp = review.days_since_sent >= 2;

  return (
    <tr className={needsAttention ? 'reviews-table__row reviews-table__row--late' : 'reviews-table__row'}>
      <td className="reviews-table__ref mono">{review.document_reference}</td>
      <td className="reviews-table__title" title={review.title}>{review.title}</td>
      <td className="mono">{formatDate(review.sent_date)}</td>
      <td>
        <span className={`reviews-age ${needsAttention ? 'reviews-age--late' : warmingUp ? 'reviews-age--soon' : ''}`}>
          {review.days_since_sent}d waiting
        </span>
      </td>
      <td className="reviews-table__action">
        <a className="reviews-open" href={`#review/${review.deliverable_id}`}>
          Open review
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 8L8 2M8 2H4.5M8 2V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </td>
    </tr>
  );
}

function filterAndSortReviews(rows: PendingReview[], query: string): PendingReview[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((review) => {
        const haystack = `${review.document_reference} ${review.title}`.toLowerCase();
        return haystack.includes(q);
      })
    : rows;

  return [...filtered].sort((a, b) => {
    const age = b.days_since_sent - a.days_since_sent;
    if (age !== 0) return age;
    return a.sent_date.localeCompare(b.sent_date);
  });
}

function buildReviewStats(rows: PendingReview[]) {
  return rows.reduce(
    (acc, review) => {
      if (review.days_since_sent >= 2) acc.waitingTwoPlus += 1;
      if (review.days_since_sent >= 4) acc.waitingFourPlus += 1;
      acc.oldestDays = Math.max(acc.oldestDays, review.days_since_sent);
      return acc;
    },
    { total: rows.length, waitingTwoPlus: 0, waitingFourPlus: 0, oldestDays: 0 },
  );
}

function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(`${iso}T00:00:00Z`));
}

function roleLabel(role: string): string {
  return role[0] + role.slice(1).toLowerCase();
}
