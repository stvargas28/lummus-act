import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { updateLeadNote } from '../../api';
import './LeadNoteButton.css';

interface LeadNoteButtonProps {
  deliverableId: string;
  initialNote: string | null;
  docRef: string;
}

export function LeadNoteButton({ deliverableId, initialNote, docRef }: LeadNoteButtonProps) {
  const [note, setNote] = useState<string | null>(initialNote);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const hasNote = note !== null && note.trim().length > 0;

  const openPopover = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setDraft(note ?? '');
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const trimmed = draft.trim() || null;
    await updateLeadNote(deliverableId, trimmed).catch(() => {});
    setNote(trimmed);
    setSaving(false);
    setOpen(false);
  };

  const cancel = () => setOpen(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancel();
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`note-btn ${hasNote ? 'note-btn--filled' : 'note-btn--empty'}`}
        onClick={openPopover}
        aria-label={hasNote ? `Edit note for ${docRef}` : `Add note for ${docRef}`}
        title={hasNote ? 'Edit internal note' : 'Add internal note'}
      >
        {hasNote ? <NoteIconFilled /> : <NoteIconOutline />}
      </button>

      {open &&
        createPortal(
          <div onKeyDown={onKeyDown}>
            <div className="note-overlay" onClick={cancel} />
            <div
              className="note-popover"
              style={{ top: pos.top, right: pos.right }}
              role="dialog"
              aria-label={`Internal note — ${docRef}`}
            >
              <div className="note-popover__header">
                <span className="note-popover__title mono">{docRef}</span>
                <span className="note-popover__subtitle">Internal note (Lead / PM)</span>
              </div>
              <textarea
                className="note-popover__textarea"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                placeholder="Add an internal note…"
                  autoFocus
              />
              <div className="note-popover__actions">
                <button
                  type="button"
                  className="note-popover__btn note-popover__btn--cancel"
                  onClick={cancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="note-popover__btn note-popover__btn--save"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function NoteIconFilled() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="10" height="12" rx="1.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="4.5" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function NoteIconOutline() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
      <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
      <line x1="4.5" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
