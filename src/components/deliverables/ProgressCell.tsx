import { useState } from 'react';
import { updateEngineerProgress } from '../../api';
import './ProgressCell.css';

const STEPS = [0, 25, 50, 75, 100] as const;
type ProgressStep = (typeof STEPS)[number];

interface ProgressCellProps {
  deliverableId: string;
  value: number | null;
  editable?: boolean;
}

export function ProgressCell({ deliverableId, value, editable = false }: ProgressCellProps) {
  const [current, setCurrent] = useState<number | null>(value);
  const pct = current ?? 0;

  if (editable) {
    const handleClick = (step: ProgressStep) => {
      setCurrent(step);
      updateEngineerProgress(deliverableId, step).catch(() => {});
    };

    return (
      <div className="prog-seg" role="group" aria-label="Progress">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            className={`prog-seg__btn ${current === step ? 'prog-seg__btn--active' : ''}`}
            onClick={() => handleClick(step)}
            title={`${step}%`}
          >
            {step}
          </button>
        ))}
      </div>
    );
  }

  if (current === null) {
    return <span className="prog-bar__none">-</span>;
  }

  return (
    <div className="prog-bar" title={`${pct}%`}>
      <div className="prog-bar__track">
        <div className="prog-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="prog-bar__label mono">{pct}%</span>
    </div>
  );
}
