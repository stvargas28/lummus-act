import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div className="confirm-dialog" role="presentation">
      <div className="confirm-dialog__overlay" onClick={busy ? undefined : onCancel} />
      <section
        className="confirm-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="confirm-dialog__body">
          <h2 id="confirm-dialog-title" className="confirm-dialog__title">{title}</h2>
          <p className="confirm-dialog__copy">{body}</p>
        </div>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-dialog__button confirm-dialog__button--confirm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
