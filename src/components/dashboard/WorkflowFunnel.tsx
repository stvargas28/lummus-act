import { useFunnel } from '../../hooks/useFunnel';
import type { ActPhase } from '../../api/types';
import './WorkflowFunnel.css';

interface WorkflowFunnelProps {
  projectId: string;
  selectedPhase: ActPhase | null;
  onSelectPhase: (phase: ActPhase | null) => void;
}

export function WorkflowFunnel({ projectId, selectedPhase, onSelectPhase }: WorkflowFunnelProps) {
  const { data, loading, error } = useFunnel(projectId);

  if (error) {
    return (
      <section className="funnel funnel--error" role="alert">
        Failed to load workflow funnel: {error.message}
      </section>
    );
  }

  const phases = data ?? [];
  const total = phases.reduce((sum, p) => sum + p.count, 0);
  const stageCount = phases.length || 6;

  const handleClick = (phase: ActPhase) => {
    onSelectPhase(selectedPhase === phase ? null : phase);
  };

  return (
    <section className="funnel" aria-label="Workflow funnel">
      <header className="funnel__header">
        <h2 className="funnel__title">
          Workflow funnel
          <span className="funnel__tag">{stageCount} stages</span>
        </h2>
        <span className="funnel__total">{loading ? '…' : `${total} docs`}</span>
      </header>

      <div className="funnel__stack" role="img" aria-label={`Phase distribution across ${total} deliverables`}>
        {loading
          ? <div className="funnel__stack-skeleton" />
          : phases.map((p) => (
              <button
                key={p.phase}
                type="button"
                className={`funnel__stack-segment ${selectedPhase === p.phase ? 'funnel__stack-segment--active' : ''}`}
                style={{
                  flexGrow: p.count,
                  backgroundColor: `var(${p.color_token})`,
                }}
                aria-label={`${p.label}: ${p.count} deliverables`}
                onClick={() => handleClick(p.phase)}
                disabled={p.count === 0}
              />
            ))}
      </div>

      <ul className="funnel__rows">
        {(loading ? Array.from({ length: 6 }, () => null) : phases).map((p, idx) => {
          if (p === null) return <li key={`s-${idx}`} className="funnel__row funnel__row--loading" />;
          const isActive = selectedPhase === p.phase;
          return (
            <li key={p.phase} className={`funnel__row ${isActive ? 'funnel__row--active' : ''}`}>
              <button
                type="button"
                className="funnel__row-button"
                onClick={() => handleClick(p.phase)}
                aria-pressed={isActive}
              >
                <span
                  className="funnel__swatch"
                  style={{ backgroundColor: `var(${p.color_token})` }}
                  aria-hidden="true"
                />
                <span className="funnel__row-meta">
                  <span className="funnel__row-label">{p.label}</span>
                  <span className="funnel__row-desc mono">{p.description}</span>
                </span>
                <span className="funnel__row-count mono">{p.count}</span>
                <span className="funnel__row-bar" aria-hidden="true">
                  <span
                    className="funnel__row-bar-fill"
                    style={{
                      width: `${Math.max(p.proportion * 100, p.count > 0 ? 2 : 0)}%`,
                      backgroundColor: `var(${p.color_token})`,
                    }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

    </section>
  );
}
