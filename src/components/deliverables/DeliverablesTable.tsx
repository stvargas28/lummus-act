import { useMemo, useState } from 'react';
import type { ActPhase, Deliverable, Role } from '../../api/types';
import { useDeliverables } from '../../hooks/useDeliverables';
import { FilterBar, type FilterState } from './FilterBar';
import { DeliverableRow } from './DeliverableRow';
import './DeliverablesTable.css';

type SortKey = 'doc_ref' | 'title' | 'owner' | 'internal_due' | 'client_due' | 'days_remaining';

interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc' | null;
}

interface DeliverablesTableProps {
  projectId: string;
  role: Role;
  /**
   * Externally-controlled phase filter (e.g., funnel selection). Applied on
   * top of the FilterBar chip state — never copied into local state, so we
   * avoid setState-in-effect.
   */
  phaseFilter?: ActPhase | null;
  /** When set, limits rows to deliverables owned by this user (Engineer "My Work"). */
  ownerUserId?: string | null;
  /** Lead view emphasizes Internal Due column; PM view emphasizes Client Due. */
  emphasis?: 'internal' | 'client';
}

const EMPTY_ROWS: Deliverable[] = [];

export function DeliverablesTable({
  projectId,
  role,
  phaseFilter = null,
  ownerUserId = null,
  emphasis,
}: DeliverablesTableProps) {
  const { data, loading, error } = useDeliverables(projectId);
  const dueEmphasis = emphasis ?? (role === 'PM' ? 'client' : 'internal');

  const [chipFilter, setChipFilter] = useState<FilterState>({
    query: '',
    phases: new Set(),
    owner: null,
    discipline: null,
  });

  const [sort, setSort] = useState<SortState>({ key: 'days_remaining', direction: null });

  // Stable reference for downstream useMemo deps.
  const all = data ?? EMPTY_ROWS;

  const ownerOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of all) {
      if (d.owner_user_id && d.owner_display_name) seen.set(d.owner_user_id, d.owner_display_name);
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const disciplineOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of all) set.add(d.discipline);
    return Array.from(set).sort();
  }, [all]);

  // Effective filter merges chip phases with the externally-driven phase
  // filter from the funnel. We never write phaseFilter into chipFilter.
  const effectivePhases = useMemo(() => {
    const set = new Set<ActPhase | 'LATE'>(chipFilter.phases);
    if (phaseFilter) set.add(phaseFilter);
    return set;
  }, [chipFilter.phases, phaseFilter]);

  const filtered = useMemo(
    () => filterDeliverables(all, chipFilter, effectivePhases, ownerUserId),
    [all, chipFilter, effectivePhases, ownerUserId],
  );
  const sorted = useMemo(() => sortDeliverables(filtered, sort), [filtered, sort]);

  if (error) {
    return (
      <div className="dt__error" role="alert">
        Failed to load deliverables: {error.message}
      </div>
    );
  }

  const cycleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key || prev.direction === null) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const arrow = (key: SortKey): string => {
    if (sort.key !== key || sort.direction === null) return '';
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <section className="dt-section" aria-label="Deliverables">
      <FilterBar
        state={{ ...chipFilter, phases: effectivePhases }}
        onChange={(next) => {
          // Strip the externally-controlled phase out before storing locally.
          const stripped = new Set(next.phases);
          if (phaseFilter) stripped.delete(phaseFilter);
          setChipFilter({ ...next, phases: stripped });
        }}
        ownerOptions={ownerOptions}
        disciplineOptions={disciplineOptions}
        resultCount={sorted.length}
        totalCount={all.length}
      />

      <div className="dt-wrapper">
        <table className="dt">
          <thead>
            <tr>
              <th className="dt__th dt__th--ref" onClick={() => cycleSort('doc_ref')}>
                Doc Ref<span className="dt__sort">{arrow('doc_ref')}</span>
              </th>
              <th className="dt__th dt__th--title" onClick={() => cycleSort('title')}>
                Title<span className="dt__sort">{arrow('title')}</span>
              </th>
              <th className="dt__th dt__th--owner" onClick={() => cycleSort('owner')}>
                Owner<span className="dt__sort">{arrow('owner')}</span>
              </th>
              <th
                className={`dt__th dt__th--date ${dueEmphasis === 'internal' ? 'dt__th--emphasis' : ''}`}
                onClick={() => cycleSort('internal_due')}
              >
                Internal Due<span className="dt__sort">{arrow('internal_due')}</span>
              </th>
              <th
                className={`dt__th dt__th--date ${dueEmphasis === 'client' ? 'dt__th--emphasis' : ''}`}
                onClick={() => cycleSort('client_due')}
              >
                Client Due<span className="dt__sort">{arrow('client_due')}</span>
              </th>
              <th className="dt__th dt__th--status">Status</th>
              <th className="dt__th dt__th--days" onClick={() => cycleSort('days_remaining')}>
                Days Rem.<span className="dt__sort">{arrow('days_remaining')}</span>
              </th>
              <th className="dt__th dt__th--action" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`loading-${i}`} className="dt__row dt__row--loading">
                  <td colSpan={8}>
                    <div className="dt__skeleton" />
                  </td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr className="dt__row">
                <td colSpan={8} className="dt__empty">
                  No deliverables match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((d) => (
                <DeliverableRow key={d.id} deliverable={d} role={role} dueEmphasis={dueEmphasis} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------- filter / sort helpers ----------

function filterDeliverables(
  rows: Deliverable[],
  chipFilter: FilterState,
  effectivePhases: Set<ActPhase | 'LATE'>,
  ownerUserId: string | null,
): Deliverable[] {
  const q = chipFilter.query.trim().toLowerCase();
  return rows.filter((d) => {
    if (ownerUserId && d.owner_user_id !== ownerUserId) return false;
    if (chipFilter.owner && d.owner_user_id !== chipFilter.owner) return false;
    if (chipFilter.discipline && d.discipline !== chipFilter.discipline) return false;
    if (effectivePhases.size > 0) {
      const matches =
        (effectivePhases.has('LATE') && d.overdue_flag) ||
        effectivePhases.has(d.act_phase);
      if (!matches) return false;
    }
    if (q) {
      const hay =
        d.document_reference.toLowerCase() +
        ' ' +
        d.title.toLowerCase() +
        ' ' +
        (d.owner_display_name?.toLowerCase() ?? '');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sortDeliverables(rows: Deliverable[], sort: SortState): Deliverable[] {
  if (sort.direction === null) return rows;
  const compare = buildComparator(sort);
  return [...rows].sort(compare);
}

function buildComparator(sort: SortState): (a: Deliverable, b: Deliverable) => number {
  const dir = sort.direction === 'desc' ? -1 : 1;
  const fn: Record<SortKey, (a: Deliverable, b: Deliverable) => number> = {
    doc_ref: (a, b) => a.document_reference.localeCompare(b.document_reference),
    title: (a, b) => a.title.localeCompare(b.title),
    owner: (a, b) => (a.owner_display_name ?? '').localeCompare(b.owner_display_name ?? ''),
    internal_due: (a, b) => compareNullableDate(a.internal_due, b.internal_due),
    client_due: (a, b) => compareNullableDate(a.client_due, b.client_due),
    days_remaining: (a, b) =>
      compareNullableNumber(a.days_remaining_internal, b.days_remaining_internal),
  };

  return (a, b) => fn[sort.key](a, b) * dir;
}

function compareNullableDate(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
}

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}
