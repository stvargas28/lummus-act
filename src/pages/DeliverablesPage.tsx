import { useState } from 'react';
import { useActiveRole } from '../hooks/useActiveRole';
import { useDeliverables } from '../hooks/useDeliverables';
import { useProject } from '../hooks/useProject';
import { useProjects } from '../hooks/useProjects';
import { useToast } from '../hooks/useToast';
import { DeliverablesTable } from '../components/deliverables/DeliverablesTable';
import { ProjectSetupNotice } from '../components/shared/ProjectSetupNotice';
import './DeliverablesPage.css';

export function DeliverablesPage() {
  const role = useActiveRole();
  const { projectId } = useProject();
  const projects = useProjects();
  const deliverables = useDeliverables(projectId ?? '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDrawingModal, setShowAddDrawingModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  if (!projectId || !role) {
    return <div>Loading…</div>;
  }

  const isLead = role === 'LEAD';
  const projectName = projects.data?.find((p) => p.id === projectId)?.name ?? projectId;
  const isUnconfigured = !deliverables.loading && (deliverables.data?.length ?? 0) === 0;

  if (isUnconfigured) {
    return (
      <div className="deliverables-page">
        <div className="deliverables-page__header">
          <h1>{isLead ? 'Project Setup' : 'Deliverables'}</h1>
        </div>

        {isLead ? (
          <LeadProjectSetup projectName={projectName} />
        ) : (
          <ProjectSetupNotice projectName={projectName} role={role} />
        )}
      </div>
    );
  }

  return (
    <div className="deliverables-page">
      <div className="deliverables-page__header">
        <h1>Deliverables</h1>
        {isLead && (
          <button
            type="button"
            className="deliverables-page__add-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Deliverable
          </button>
        )}
      </div>

      <DeliverablesTable
        projectId={projectId}
        role={role}
        allowProgressEdit={false}
      />

      {showAddModal && (
        <AddDeliverableModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onAddDrawing={() => {
            setShowAddModal(false);
            setShowAddDrawingModal(true);
          }}
          onSplit={() => {
            setShowAddModal(false);
            setShowSplitModal(true);
          }}
        />
      )}

      {showAddDrawingModal && (
        <AddRelatedDrawingModal
          projectId={projectId}
          onClose={() => setShowAddDrawingModal(false)}
        />
      )}

      {showSplitModal && (
        <SplitIntoSeriesModal
          projectId={projectId}
          onClose={() => setShowSplitModal(false)}
        />
      )}
    </div>
  );
}

function LeadProjectSetup({ projectName }: { projectName: string }) {
  const { push } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parserState, setParserState] = useState<'idle' | 'ready' | 'parsed'>('idle');

  function acceptFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    setParserState('ready');
  }

  function runParser() {
    setParserState('parsed');
    push('Deliverable table parsed. Matching preview is ready for review.', 'success');
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    acceptFile(event.dataTransfer.files[0] ?? null);
  }

  return (
    <section className="setup-panel" aria-labelledby="setup-title">
      <div className="setup-panel__head">
        <span className="section-label">Project discovered</span>
        <h2 id="setup-title" className="setup-panel__title">Start {projectName}</h2>
        <p className="setup-panel__copy">
          Upload the Excel deliverable table to seed ACT. The parser reads the register, creates the
          deliverable list, and prepares matching against FusionLive.
        </p>
      </div>

      <label
        className={`setup-dropzone ${fileName ? 'setup-dropzone--has-file' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <input
          className="setup-dropzone__input"
          type="file"
          accept=".xls,.xlsx,.csv"
          onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
        />
        <span className="setup-dropzone__icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 18V6M14 6L9.5 10.5M14 6L18.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 18.5V21C6 22.1046 6.89543 23 8 23H20C21.1046 23 22 22.1046 22 21V18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <span className="setup-dropzone__title">
          {fileName ?? 'Drop Excel deliverable table here'}
        </span>
        <span className="setup-dropzone__hint">or upload from folder</span>
      </label>

      <div className="setup-actions">
        <button
          type="button"
          className="setup-actions__primary"
          disabled={parserState === 'idle' || parserState === 'parsed'}
          onClick={runParser}
        >
          {parserState === 'parsed' ? 'Parser preview ready' : 'Run parser'}
        </button>
        <span className="setup-actions__meta mono">
          {parserState === 'idle'
            ? 'Waiting for workbook'
            : parserState === 'ready'
              ? 'Workbook selected'
              : '42 rows found / 38 auto-matched / 4 need Lead review'}
        </span>
      </div>

      <div className="setup-preview" aria-hidden="true">
        <div className="setup-preview__row setup-preview__row--head">
          <span>Doc Ref</span>
          <span>Owner</span>
          <span>Internal Due</span>
          <span>Status</span>
        </div>
        {['361325-ME-DW-170001', '361325-ME-SP-170002', '361325-PR-LS-170003'].map((ref, index) => (
          <div key={ref} className="setup-preview__row">
            <span>{ref}</span>
            <span>{index === 2 ? 'Needs review' : 'Matched'}</span>
            <span>{index === 0 ? '08 May 26' : index === 1 ? '12 May 26' : 'Missing'}</span>
            <span>{index === 2 ? 'Unmatched' : 'Ready'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface AddDeliverableModalProps {
  projectId: string;
  onClose: () => void;
  onAddDrawing: () => void;
  onSplit: () => void;
}

function AddDeliverableModal({
  projectId: _projectId,
  onClose,
}: AddDeliverableModalProps) {
  const [docRef, setDocRef] = useState('');
  const [title, setTitle] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef.trim() || !title.trim()) return;

    setSaving(true);
    // TODO: Call API to create deliverable
    // For now, just close the modal as a stub
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal modal--add-deliverable">
        <div className="modal__header">
          <h2>Add Deliverable</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="modal__field">
            <label htmlFor="doc-ref">Doc Ref *</label>
            <input
              id="doc-ref"
              type="text"
              placeholder="e.g., P-001-DW-001"
              value={docRef}
              onChange={(e) => setDocRef(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="modal__field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              placeholder="Document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="modal__field">
            <label htmlFor="discipline">Discipline</label>
            <input
              id="discipline"
              type="text"
              placeholder="e.g., Drawing, Specification"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="modal__btn modal__btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal__btn modal__btn--primary"
              disabled={saving || !docRef.trim() || !title.trim()}
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>

        <p className="modal__note">
          New deliverables start as NOT_STARTED and remain unmatched until a matching FusionLive document is detected.
        </p>
      </div>
    </>
  );
}

interface AddRelatedDrawingModalProps {
  projectId: string;
  onClose: () => void;
}

function AddRelatedDrawingModal({
  projectId: _projectId,
  onClose,
}: AddRelatedDrawingModalProps) {
  const [docRef, setDocRef] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef.trim() || !title.trim()) return;

    setSaving(true);
    // TODO: Call API to create related drawing
    // For now, just close the modal as a stub
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal modal--add-drawing">
        <div className="modal__header">
          <h2>Add Related Drawing</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="modal__field">
            <label htmlFor="drawing-ref">Doc Ref *</label>
            <input
              id="drawing-ref"
              type="text"
              placeholder="e.g., P-001-DW-002"
              value={docRef}
              onChange={(e) => setDocRef(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="modal__field">
            <label htmlFor="drawing-title">Title *</label>
            <input
              id="drawing-title"
              type="text"
              placeholder="Related drawing title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="modal__btn modal__btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal__btn modal__btn--primary"
              disabled={saving || !docRef.trim() || !title.trim()}
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

interface SplitIntoSeriesModalProps {
  projectId: string;
  onClose: () => void;
}

function SplitIntoSeriesModal({
  projectId: _projectId,
  onClose,
}: SplitIntoSeriesModalProps) {
  const [count, setCount] = useState(2);
  const [suffix, setSuffix] = useState('Rev');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Call API to split into series
    // For now, just close the modal as a stub
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal modal--split-series">
        <div className="modal__header">
          <h2>Split Into Series</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="modal__field">
            <label htmlFor="series-count">Number of revisions</label>
            <input
              id="series-count"
              type="number"
              min="2"
              max="10"
              value={count}
              onChange={(e) => setCount(Math.max(2, parseInt(e.target.value) || 2))}
              disabled={saving}
            />
          </div>

          <div className="modal__field">
            <label htmlFor="series-suffix">Suffix pattern</label>
            <input
              id="series-suffix"
              type="text"
              placeholder="e.g., Rev"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              disabled={saving}
            />
            <p className="modal__hint">
              Creates: {suffix}A, {suffix}B, {suffix}C, etc.
            </p>
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="modal__btn modal__btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal__btn modal__btn--primary"
              disabled={saving}
            >
              {saving ? 'Splitting…' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
