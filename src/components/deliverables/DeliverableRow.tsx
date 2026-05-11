import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { updateDeliverableHold, updateDeliverableOwner } from '../../api';
import type { Deliverable, ProjectMember, Role } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { HoldChip, LateChip, StatusChip } from './StatusChip';
import { ProgressCell } from './ProgressCell';
import { LeadNoteButton } from './LeadNoteButton';

interface DeliverableRowProps {
  deliverable: Deliverable;
  role: Role;
  dueEmphasis: 'internal' | 'client';
  daysBasis: 'internal' | 'client';
  showNoteColumn?: boolean;
  progressEditable?: boolean;
  assignableMembers?: ProjectMember[];
}

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(`${iso}T00:00:00Z`);
  return DATE_FMT.format(d);
}

function formatDays(n: number | null): string {
  if (n === null) return '-';
  return `${n}`;
}

function activeDaysRemaining(d: Deliverable, basis: 'internal' | 'client'): number | null {
  if (d.act_phase === 'ISSUED') return null;
  return basis === 'client' ? d.days_remaining_client : d.days_remaining_internal;
}

export function DeliverableRow({
  deliverable,
  role,
  dueEmphasis,
  daysBasis,
  showNoteColumn = false,
  progressEditable = false,
  assignableMembers = [],
}: DeliverableRowProps) {
  const [row, setRow] = useState(deliverable);
  const showActionMenu = role === 'LEAD';
  const daysRemaining = activeDaysRemaining(row, daysBasis);
  const isIssued = row.act_phase === 'ISSUED';
  const effectiveOverdue = row.overdue_flag && !row.hold_active;

  return (
    <tr className={`dt__row ${effectiveOverdue ? 'dt__row--overdue' : ''} ${row.hold_active ? 'dt__row--hold' : ''}`}>
      <td className="dt__td dt__td--ref">
        <a
          className="dt__ref mono"
          href={row.fusion_document_id ? `#fusion/${row.fusion_document_id}` : undefined}
          target="_blank"
          rel="noreferrer"
        >
          {row.document_reference}
        </a>
      </td>
      <td className="dt__td dt__td--title" title={row.title}>
        <span>{row.title}</span>
      </td>
      <td className="dt__td dt__td--owner">
        {row.owner_display_name ? (
          <div className="dt__owner">
            <span className="dt__owner-avatar mono" aria-hidden="true">
              {ownerInitials(row.owner_display_name)}
            </span>
            <span className="dt__owner-name">{row.owner_display_name}</span>
          </div>
        ) : (
          <span className="dt__owner-missing">No owner</span>
        )}
      </td>
      <td
        className={`dt__td dt__td--date mono ${dueEmphasis === 'internal' ? 'dt__td--emphasis' : ''} ${
          !row.hold_active && !isIssued && row.days_remaining_internal !== null && row.days_remaining_internal < 0 ? 'dt__td--past' : ''
        }`}
      >
        {formatDate(row.internal_due)}
      </td>
      <td
        className={`dt__td dt__td--date mono ${dueEmphasis === 'client' ? 'dt__td--emphasis' : ''} ${
          !row.hold_active && !isIssued && row.days_remaining_client !== null && row.days_remaining_client < 0 ? 'dt__td--past' : ''
        }`}
      >
        {formatDate(row.client_due)}
      </td>
      <td className="dt__td dt__td--status">
        <div className="dt__chips">
          <StatusChip phase={row.act_phase} />
          {row.hold_active ? <HoldChip /> : effectiveOverdue && <LateChip />}
        </div>
      </td>
      <td className="dt__td dt__td--progress">
        <ProgressCell
          deliverableId={row.id}
          value={row.engineer_progress_percent}
          editable={progressEditable}
        />
      </td>
      <td
        className={`dt__td dt__td--days mono ${
        !row.hold_active && daysRemaining !== null && daysRemaining < 0 ? 'dt__td--past' : ''
        }`}
      >
        {formatDays(daysRemaining)}
      </td>
      <td className="dt__td dt__td--action">
        <a
          className="dt__view-btn"
          href={row.fusion_document_id ? `#fusion/${row.fusion_document_id}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${row.document_reference} in FusionLive`}
        >
          View
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ marginLeft: 3 }}>
            <path d="M2 8L8 2M8 2H4.5M8 2V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        {showActionMenu && (
          <DeliverableActionMenu
            deliverable={row}
            assignableMembers={assignableMembers}
            onOwnerSaved={setRow}
            onHoldSaved={setRow}
          />
        )}
      </td>
      {showNoteColumn && (
        <td className="dt__td dt__td--note">
          <LeadNoteButton
            deliverableId={row.id}
            initialNote={row.lead_private_note}
            docRef={row.document_reference}
          />
        </td>
      )}
    </tr>
  );
}

function DeliverableActionMenu({
  deliverable,
  assignableMembers,
  onOwnerSaved,
  onHoldSaved,
}: {
  deliverable: Deliverable;
  assignableMembers: ProjectMember[];
  onOwnerSaved: (next: Deliverable) => void;
  onHoldSaved: (next: Deliverable) => void;
}) {
  const { push } = useToast();
  const { persona } = useAuth();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftOwner, setDraftOwner] = useState(deliverable.owner_user_id ?? '');
  const [pendingHoldActive, setPendingHoldActive] = useState<boolean | null>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const openMenu = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setDraftOwner(deliverable.owner_user_id ?? '');
    setOpen(true);
  };

  const close = () => setOpen(false);

  const saveOwner = async () => {
    setSaving(true);
    const ownerUserId = draftOwner || null;
    const previous = deliverable;
    const selected = assignableMembers.find((m) => m.user_id === ownerUserId) ?? null;
    onOwnerSaved({
      ...deliverable,
      owner_user_id: selected?.user_id ?? null,
      owner_display_name: selected?.display_name ?? null,
      engineer_progress_percent: selected ? deliverable.engineer_progress_percent ?? 0 : null,
    });

    try {
      const next = await updateDeliverableOwner(deliverable.id, ownerUserId);
      onOwnerSaved(next);
      push('Owner updated.', 'success');
      close();
    } catch {
      onOwnerSaved(previous);
      push('Could not update owner.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const toggleHold = async () => {
    if (!persona || pendingHoldActive === null) return;
    const nextActive = pendingHoldActive;

    const previous = deliverable;
    onHoldSaved({
      ...deliverable,
      hold_active: nextActive,
      hold_set_at: nextActive ? new Date().toISOString() : null,
      hold_set_by: nextActive ? persona.user_id : null,
    });
    setSaving(true);

    try {
      const next = await updateDeliverableHold(deliverable.id, nextActive, persona.user_id);
      onHoldSaved(next);
      setPendingHoldActive(null);
      push(nextActive ? 'Deliverable hold enabled.' : 'Deliverable alerts resumed.', 'success');
      close();
    } catch {
      onHoldSaved(previous);
      push(nextActive ? 'Could not hold deliverable.' : 'Could not resume deliverable alerts.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="dt__menu"
        aria-label={`Row actions for ${deliverable.document_reference}`}
        title="Actions"
        onClick={openMenu}
      >
        ...
      </button>
      {open &&
        createPortal(
          <div onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
            <div className="dt-menu-overlay" onClick={close} />
            <div
              className="dt-menu-popover"
              style={{ top: pos.top, right: pos.right }}
              role="dialog"
              aria-label={`Row actions for ${deliverable.document_reference}`}
            >
              <div className="dt-menu-popover__header">
                <span className="dt-menu-popover__title mono">{deliverable.document_reference}</span>
                <span className="dt-menu-popover__subtitle">Lead actions</span>
              </div>
              <label className="dt-menu-popover__field">
                <span>Assigned owner</span>
                <select
                  value={draftOwner}
                  onChange={(event) => setDraftOwner(event.target.value)}
                  disabled={saving}
                >
                  <option value="">No owner</option>
                  {assignableMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="dt-menu-popover__section">
                <button
                  type="button"
                  className={`dt-menu-popover__hold ${deliverable.hold_active ? 'dt-menu-popover__hold--resume' : ''}`}
                  onClick={() => setPendingHoldActive(!deliverable.hold_active)}
                  disabled={saving}
                >
                  {deliverable.hold_active ? 'Resume deliverable' : 'Hold deliverable'}
                </button>
              </div>
              <div className="dt-menu-popover__actions">
                <button type="button" className="dt-menu-popover__btn dt-menu-popover__btn--cancel" onClick={close}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="dt-menu-popover__btn dt-menu-popover__btn--save"
                  onClick={saveOwner}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <ConfirmDialog
        open={pendingHoldActive !== null}
        title={pendingHoldActive ? 'Hold this deliverable?' : 'Resume deliverable alerts?'}
        body={
          pendingHoldActive
            ? `Alerts for ${deliverable.document_reference} will pause. Other deliverables are unaffected.`
            : `ACT will evaluate ${deliverable.document_reference} against its current due dates.`
        }
        confirmLabel={pendingHoldActive ? 'Hold deliverable' : 'Resume alerts'}
        busy={saving}
        onCancel={() => setPendingHoldActive(null)}
        onConfirm={toggleHold}
      />
    </>
  );
}

function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
