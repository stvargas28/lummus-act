import type { Deliverable, Role } from '../../api/types';
import { LateChip, StatusChip } from './StatusChip';
import { ProgressCell } from './ProgressCell';
import { LeadNoteButton } from './LeadNoteButton';

interface DeliverableRowProps {
  deliverable: Deliverable;
  role: Role;
  dueEmphasis: 'internal' | 'client';
  daysBasis: 'internal' | 'client';
  showNoteColumn?: boolean;
  progressEditable?: boolean;
}

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00Z');
  return DATE_FMT.format(d);
}

function formatDays(n: number | null): string {
  if (n === null) return '—';
  return `${n}`;
}

function activeDaysRemaining(d: Deliverable, basis: 'internal' | 'client'): number | null {
  if (d.act_phase === 'ISSUED') return null;
  return basis === 'client' ? d.days_remaining_client : d.days_remaining_internal;
}

export function DeliverableRow({
  deliverable: d,
  role,
  dueEmphasis,
  daysBasis,
  showNoteColumn = false,
  progressEditable = false,
}: DeliverableRowProps) {
  const showActionMenu = role === 'LEAD' || role === 'PM';
  const daysRemaining = activeDaysRemaining(d, daysBasis);
  const isIssued = d.act_phase === 'ISSUED';

  return (
    <tr className={`dt__row ${d.overdue_flag ? 'dt__row--overdue' : ''}`}>
      <td className="dt__td dt__td--ref">
        <a
          className="dt__ref mono"
          href={d.fusion_document_id ? `#fusion/${d.fusion_document_id}` : undefined}
          target="_blank"
          rel="noreferrer"
        >
          {d.document_reference}
        </a>
      </td>
      <td className="dt__td dt__td--title" title={d.title}>
        <span>{d.title}</span>
      </td>
      <td className="dt__td dt__td--owner">
        {d.owner_display_name ? (
          <div className="dt__owner">
            <span className="dt__owner-avatar mono" aria-hidden="true">
              {ownerInitials(d.owner_display_name)}
            </span>
            <span className="dt__owner-name">{d.owner_display_name}</span>
          </div>
        ) : (
          <span className="dt__owner-missing">No owner</span>
        )}
      </td>
      <td
        className={`dt__td dt__td--date mono ${dueEmphasis === 'internal' ? 'dt__td--emphasis' : ''} ${
          !isIssued && d.days_remaining_internal !== null && d.days_remaining_internal < 0 ? 'dt__td--past' : ''
        }`}
      >
        {formatDate(d.internal_due)}
      </td>
      <td
        className={`dt__td dt__td--date mono ${dueEmphasis === 'client' ? 'dt__td--emphasis' : ''} ${
          !isIssued && d.days_remaining_client !== null && d.days_remaining_client < 0 ? 'dt__td--past' : ''
        }`}
      >
        {formatDate(d.client_due)}
      </td>
      <td className="dt__td dt__td--status">
        <div className="dt__chips">
          <StatusChip phase={d.act_phase} />
          {d.overdue_flag && <LateChip />}
        </div>
      </td>
      <td className="dt__td dt__td--progress">
        <ProgressCell
          deliverableId={d.id}
          value={d.engineer_progress_percent}
          editable={progressEditable}
        />
      </td>
      <td
        className={`dt__td dt__td--days mono ${
          daysRemaining !== null && daysRemaining < 0 ? 'dt__td--past' : ''
        }`}
      >
        {formatDays(daysRemaining)}
      </td>
      <td className="dt__td dt__td--action">
        <a
          className="dt__view-btn"
          href={d.fusion_document_id ? `#fusion/${d.fusion_document_id}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${d.document_reference} in FusionLive`}
        >
          View
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ marginLeft: 3 }}>
            <path d="M2 8L8 2M8 2H4.5M8 2V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        {showActionMenu && (
          <button className="dt__menu" aria-label={`Row actions for ${d.document_reference}`} title="Actions">
            ⋯
          </button>
        )}
      </td>
      {showNoteColumn && (
        <td className="dt__td dt__td--note">
          <LeadNoteButton
            deliverableId={d.id}
            initialNote={d.lead_private_note}
            docRef={d.document_reference}
          />
        </td>
      )}
    </tr>
  );
}

function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
