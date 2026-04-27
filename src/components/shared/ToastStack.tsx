import { useToast } from '../../hooks/useToast';
import './ToastStack.css';

export function ToastStack() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          <span className="toast__text">{t.text}</span>
          <button className="toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
