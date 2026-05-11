import { useKpiSummary } from '../../hooks/useKpiSummary';
import { KpiCard } from './KpiCard';
import './KpiCardRow.css';

interface KpiCardRowProps {
  projectId: string;
  role: 'LEAD' | 'PM';
  frozen?: boolean;
}

export function KpiCardRow({ projectId, role, frozen = false }: KpiCardRowProps) {
  const { data, loading, error } = useKpiSummary(projectId, role);

  if (error) {
    return (
      <div className="kpi-row__error" role="alert">
        Failed to load KPI summary: {error.message}
      </div>
    );
  }

  const slots = data ?? [
    placeholder('p1'),
    placeholder('p2'),
    placeholder('p3'),
    placeholder('p4'),
  ];

  return (
    <section className="kpi-row" aria-label="Project key metrics">
      {slots.map((card) => (
        <KpiCard key={card.key} loading={loading} card={card} frozen={frozen} />
      ))}
    </section>
  );
}

function placeholder(key: string) {
  return {
    key,
    label: ' ',
    value: null,
    delta_count: null,
    delta_direction: 'flat' as const,
    delta_semantic: 'neutral' as const,
    color_token: '--color-border',
  };
}
