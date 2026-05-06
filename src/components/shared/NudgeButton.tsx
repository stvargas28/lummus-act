import { useState } from 'react';
import { nudge } from '../../api';
import { useToast } from '../../hooks/useToast';
import './NudgeButton.css';

interface NudgeButtonProps {
  deliverableId: string;
  recipientUserId: string | null;
  alreadyAlertedToday: boolean;
  lastAlertAt: string | null;
}

type LocalState = 'idle' | 'sending' | 'sent';

function formatRelativeHour(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function NudgeButton({ deliverableId, recipientUserId, alreadyAlertedToday, lastAlertAt }: NudgeButtonProps) {
  const [state, setState] = useState<LocalState>('idle');
  const { push } = useToast();

  if (alreadyAlertedToday) {
    const tooltip = lastAlertAt
      ? `Last alert sent at ${formatRelativeHour(lastAlertAt)}. The 24h cap blocks another notification today.`
      : 'An alert was already sent today.';
    return (
      <span className="nudge-btn nudge-btn--suppressed" title={tooltip}>
        Notified today
      </span>
    );
  }

  if (state === 'sent') {
    return (
      <span className="nudge-btn nudge-btn--sent" title="Reminder sent via Teams">
        Sent
      </span>
    );
  }

  const onClick = async () => {
    if (!recipientUserId) return;
    setState('sending');
    try {
      await nudge(deliverableId, recipientUserId);
      setState('sent');
      push('Reminder sent via Teams.', 'success');
    } catch (err) {
      setState('idle');
      push(err instanceof Error ? err.message : 'Failed to send reminder.', 'danger');
    }
  };

  const disabled = !recipientUserId || state === 'sending';
  const label = state === 'sending' ? 'Sending...' : 'Nudge ->';
  const title = recipientUserId
    ? 'Send a reminder to the responsible person via Teams'
    : 'No assigned recipient - cannot nudge';

  return (
    <button className="nudge-btn nudge-btn--active" disabled={disabled} onClick={onClick} title={title}>
      {label}
    </button>
  );
}
