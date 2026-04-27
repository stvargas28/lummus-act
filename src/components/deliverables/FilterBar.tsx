import type { ActPhase } from '../../api/types';
import './FilterBar.css';

export interface FilterState {
  query: string;
  phases: Set<ActPhase | 'LATE'>;
  owner: string | null;
  discipline: string | null;
}

const PHASE_FILTERS: Array<{ key: ActPhase | 'LATE'; label: string }> = [
  { key: 'LATE', label: 'Late' },
  { key: 'NOT_STARTED', label: 'Not started' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'UNDER_REVIEW', label: 'In review' },
  { key: 'REVISING', label: 'Revising' },
  { key: 'READY_FOR_ISSUE', label: 'Ready' },
  { key: 'ISSUED', label: 'Issued' },
];

interface FilterBarProps {
  state: FilterState;
  onChange: (next: FilterState) => void;
  ownerOptions: Array<{ id: string; name: string }>;
  disciplineOptions: string[];
  resultCount: number;
  totalCount: number;
}

export function FilterBar({
  state,
  onChange,
  ownerOptions,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const togglePhase = (key: ActPhase | 'LATE') => {
    const next = new Set(state.phases);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...state, phases: next });
  };

  const showAll = () => onChange({ ...state, phases: new Set() });

  return (
    <div className="filter-bar">
      <div className="filter-bar__search-wrap">
        <span className="filter-bar__search-icon" aria-hidden="true">⌕</span>
        <input
          className="filter-bar__search"
          type="search"
          placeholder="Filter by ref, title, owner…"
          value={state.query}
          onChange={(e) => onChange({ ...state, query: e.target.value })}
          aria-label="Filter deliverables"
        />
      </div>

      <div className="filter-bar__chips">
        <button
          type="button"
          className={`filter-bar__chip ${state.phases.size === 0 ? 'filter-bar__chip--active' : ''}`}
          onClick={showAll}
        >
          All
        </button>
        {PHASE_FILTERS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`filter-bar__chip ${state.phases.has(p.key) ? 'filter-bar__chip--active' : ''} ${
              p.key === 'LATE' ? 'filter-bar__chip--danger' : ''
            }`}
            onClick={() => togglePhase(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {ownerOptions.length > 0 && (
        <select
          className="filter-bar__select"
          value={state.owner ?? ''}
          onChange={(e) => onChange({ ...state, owner: e.target.value || null })}
          aria-label="Filter by owner"
        >
          <option value="">All owners</option>
          {ownerOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      )}

      <span className="filter-bar__count mono">
        {resultCount} / {totalCount}
      </span>
    </div>
  );
}
