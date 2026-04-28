import { useState } from 'react';
import { useActiveRole } from '../hooks/useActiveRole';
import { useProject } from '../hooks/useProject';
import { DeliverablesTable } from '../components/deliverables/DeliverablesTable';
import './DeliverablesPage.css';

export function DeliverablesPage() {
  const role = useActiveRole();
  const { projectId } = useProject();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDrawingModal, setShowAddDrawingModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  if (!projectId || !role) {
    return <div>Loading…</div>;
  }

  const isLead = role === 'LEAD';

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
