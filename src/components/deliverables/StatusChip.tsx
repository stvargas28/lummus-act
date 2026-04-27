import type { ActPhase } from '../../api/types';
import './StatusChip.css';

interface PhaseChipMeta {
  label: string;
  className: string;
}

const PHASE_CHIPS: Record<ActPhase, PhaseChipMeta> = {
  NOT_STARTED: { label: 'Not started', className: 'chip--not-started' },
  DRAFT: { label: 'Draft', className: 'chip--draft' },
  UNDER_REVIEW: { label: 'In review', className: 'chip--under-review' },
  REVISING: { label: 'Revising', className: 'chip--revising' },
  READY_FOR_ISSUE: { label: 'Ready', className: 'chip--ready' },
  ISSUED: { label: 'Issued', className: 'chip--issued' },
};

export function StatusChip({ phase }: { phase: ActPhase }) {
  const meta = PHASE_CHIPS[phase];
  return <span className={`chip ${meta.className}`}>{meta.label}</span>;
}

export function LateChip() {
  return <span className="chip chip--late">LATE</span>;
}
