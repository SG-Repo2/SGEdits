import { useState, useMemo } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { generateWeeklyDraft, getNextMonday, calculateWeekNumber } from '../../lib/draftGenerator';
import { normalizeScore } from '../../lib/scoreConversion';

const SECTIONS = ['PAT', 'QR', 'RC', 'Bio', 'GChem', 'OChem'];

const SECTION_COLORS = {
  PAT: '#6366f1',
  QR: '#f59e0b',
  RC: '#10b981',
  Bio: '#ef4444',
  GChem: '#3b82f6',
  OChem: '#8b5cf6',
};

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function hoursToLabel(h) {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h === Math.floor(h)) return `${h}h`;
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

function ScoreBar({ section, current, target }) {
  const pct = Math.min(100, Math.max(0, ((current - 200) / 400) * 100));
  const tPct = Math.min(100, Math.max(0, ((target - 200) / 400) * 100));
  const color = SECTION_COLORS[section] || '#6366f1';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-labels">
        <span className="score-bar-section" style={{ color }}>{section}</span>
        <span className="score-bar-vals">
          <span className="score-current">{current}</span>
          <span className="score-arrow">â</span>
          <span className="score-target" style={{ color }}>{target}</span>
        </span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color, opacity: 0.35 }} />
        <div className="score-bar-target-line" style={{ left: `${tPct}%`, borderColor: color }} />
      </div>
    </div>
  );
}

function PlanBlock({ block, onEdit }) {
  const color = SECTION_COLORS[block.section] || '#6366f1';
  const pColor = PRIORITY_COLORS[block.priority] || PRIORITY_COLORS.medium;
  return (
    <div className="plan-block" style={{ borderLeftColor: color }}>
      <div className="plan-block-top">
        <span className="plan-block-section" style={{ color }}>{block.section}</span>
        <span className="plan-block-hours">{hoursToLabel(block.hours)}</span>
        <span className="plan-block-priority" style={{ color: pColor }}>{block.priority}</span>
      </div>
      {block.topics && block.topics.length > 0 && (
        <div className="plan-block-topics">
          {block.topics.map((t, i) => (
            <span key={i} className="plan-block-topic">{t}</span>
          ))}
        </div>
      )}
      {block.notes && <p className="plan-block-notes">{block.notes}</p>}
      <button className="plan-block-edit-btn text-muted" onClick={() => onEdit(block)} title="Edit block">â</button>
    </div>
  );
}

function EditBlockModal({ block, onSave, onCancel }) {
  const [form, setForm] = useState({
    section: block.section || SECTIONS[0],
    hours: block.hours || 1,
    priority: block.priority || 'medium',
    topics: (block.topics || []).join(', '),
    notes: block.notes || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    onSave({
      ...block,
      section: form.section,
      hours: parseFloat(form.hours) || 1,
      priority: form.priority,
      topics: form.topics.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes,
    });
  };
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h4 className="modal-title">Edit Plan Block</h4>
        <div className="modal-grid">
          <div className="form-field">
            <label>Section</label>
            <select value={form.section} onChange={e => set('section', e.target.value)}>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Hours</label>
            <input type="number" min="0.25" max="8" step="0.25" value={form.hours}
              onChange={e => set('hours', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="form-field" style={{ marginBottom: '0.75rem' }}>
          <label>Topics (comma-separated)</label>
          <input type="text" value={form.topics} onChange={e => set('topics', e.target.value)}
            placeholder="e.g. Resonance, Stereochemistry" />
        </div>
        <div className="form-field" style={{ marginBottom: '1rem' }}>
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={2} placeholder="Coach notes for this block..." />
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function CoachPlanningHub() {
  const { students, currentUser, addWeeklyPlan, updateWeeklyPlan } = usePortal() || {};

  const myStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s =>
      !currentUser || s.coachId === currentUser.id || currentUser.role === 'admin'
    );
  }, [students, currentUser]);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' | 'scores' | 'history'
  const [plan, setPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [newBlock, setNewBlock] = useState({
    section: SECTIONS[0], hours: 1, priority: 'medium', topics: '', notes: '',
  });

  const selectedStudent = useMemo(
    () => myStudents.find(s => s.id === selectedStudentId) || null,
    [myStudents, selectedStudentId]
  );

  // Derive current scores from latest check-in
  const currentScores = useMemo(() => {
    if (!selectedStudent) return {};
    const checkIns = selectedStudent.checkIns || [];
    if (!checkIns.length) return {};
    const latest = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return latest.scores || {};
  }, [selectedStudent]);

  const targetScores = useMemo(() => {
    if (!selectedStudent) return {};
    return selectedStudent.targetScores || {};
  }, [selectedStudent]);

  // Score deltas
  const scoreDeltas = useMemo(() => {
    const out = {};
    SECTIONS.forEach(s => {
      const cur = currentScores[s] ? normalizeScore(currentScores[s], s) : 200;
      const tgt = targetScores[s] ? normalizeScore(targetScores[s], s) : 300;
      out[s] = { current: cur, target: tgt, gap: tgt - cur };
    });
    return out;
  }, [currentScores, targetScores]);

  function handleGenerateDraft() {
    if (!selectedStudent) return;
    setIsGenerating(true);
    try {
      const weeklyHours = selectedStudent.weeklyHours || 20;
      const testDate = selectedStudent.testDate || null;
      const draft = generateWeeklyDraft({
        student: selectedStudent,
        currentScores,
        targetScores,
        weeklyHours,
        testDate,
      });
      setPlan(draft);
    } catch (e) {
      console.error('Draft generation error:', e);
      // fallback: simple equal distribution
      const weeklyHours = selectedStudent.weeklyHours || 20;
      const hoursEach = Math.round((weeklyHours / SECTIONS.length) * 4) / 4;
      const blocks = SECTIONS.map(s => ({
        id: `${s}-${Date.now()}`,
        section: s,
        hours: hoursEach,
        priority: 'medium',
        topics: [],
        notes: '',
      }));
      setPlan({
        weekOf: getNextMonday(),
        weekNumber: calculateWeekNumber(selectedStudent.startDate),
        totalHours: weeklyHours,
        blocks,
        notes: '',
      });
    }
    setIsGenerating(false);
  }

  function handleEditBlock(block) {
    setEditingBlock({ ...block });
  }

  function handleSaveBlock(updated) {
    setPlan(p => ({
      ...p,
      blocks: p.blocks.map(b => b.id === updated.id ? updated : b),
    }));
    setEditingBlock(null);
  }

  function handleAddBlock() {
    const block = {
      id: `new-${Date.now()}`,
      section: newBlock.section,
      hours: parseFloat(newBlock.hours) || 1,
      priority: newBlock.priority,
      topics: newBlock.topics.split(',').map(t => t.trim()).filter(Boolean),
      notes: newBlock.notes,
    };
    setPlan(p => ({ ...p, blocks: [...p.blocks, block] }));
    setNewBlock({ section: SECTIONS[0], hours: 1, priority: 'medium', topics: '', notes: '' });
    setShowAddBlock(false);
  }

  function handleRemoveBlock(id) {
    setPlan(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }));
  }

  async function handleSavePlan() {
    if (!plan || !selectedStudent) return;
    setIsSaving(true);
    try {
      const planToSave = { ...plan, studentId: selectedStudent.id, savedAt: new Date().toISOString() };
      if (plan.id && updateWeeklyPlan) {
        await updateWeeklyPlan(selectedStudent.id, plan.id, planToSave);
      } else if (addWeeklyPlan) {
        await addWeeklyPlan(selectedStudent.id, planToSave);
      }
      setSavedMsg('Plan saved!');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (e) {
      console.error('Save error:', e);
      setSavedMsg('Error saving plan');
      setTimeout(() => setSavedMsg(''), 2500);
    }
    setIsSaving(false);
  }

  // Total hours summary
  const totalPlannedHours = useMemo(() => {
    if (!plan) return 0;
    return plan.blocks.reduce((sum, b) => sum + (b.hours || 0), 0);
  }, [plan]);

  const sectionTotals = useMemo(() => {
    if (!plan) return {};
    const out = {};
    plan.blocks.forEach(b => {
      out[b.section] = (out[b.section] || 0) + b.hours;
    });
    return out;
  }, [plan]);

  const historicalPlans = useMemo(() => {
    if (!selectedStudent) return [];
    return (selectedStudent.weeklyPlans || []).sort((a, b) => new Date(b.weekOf) - new Date(a.weekOf));
  }, [selectedStudent]);

  return (
    <div className="cph-page">
      {/* Student selector */}
      <div className="cph-header">
        <div className="cph-title-row">
          <h2>Planning Hub</h2>
          {savedMsg && <span className="save-msg">{savedMsg}</span>}
        </div>
        <div className="student-selector-row">
          <label className="selector-label">Student</label>
          <select
            className="student-select"
            value={selectedStudentId || ''}
            onChange={e => { setSelectedStudentId(e.target.value || null); setPlan(null); }}
          >
            <option value="">â Select a student â</option>
            {myStudents.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedStudent && (
        <div className="empty-state">
          <p>Select a student to view their planning hub.</p>
        </div>
      )}

      {selectedStudent && (
        <>
          {/* Tab bar */}
          <div className="cph-tabs">
            {[
              { id: 'plan', label: 'Weekly Plan' },
              { id: 'scores', label: 'Scores' },
              { id: 'history', label: `History (${historicalPlans.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                className={`cph-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ââ PLAN TAB ââ */}
          {activeTab === 'plan' && (
            <div className="plan-tab">
              {/* Student summary card */}
              <div className="student-summary-card">
                <div className="ss-row">
                  <div className="ss-field">
                    <span className="ss-label">Student</span>
                    <span className="ss-val">{selectedStudent.name}</span>
                  </div>
                  <div className="ss-field">
                    <span className="ss-label">Test Date</span>
                    <span className="ss-val">{selectedStudent.testDate ? formatDate(selectedStudent.testDate) : 'â'}</span>
                  </div>
                  <div className="ss-field">
                    <span className="ss-label">Weekly Hours</span>
                    <span className="ss-val">{selectedStudent.weeklyHours || 20}h</span>
                  </div>
                  <div className="ss-field">
                    <span className="ss-label">Check-ins</span>
                    <span className="ss-val">{(selectedStudent.checkIns || []).length}</span>
                  </div>
                </div>
              </div>

              {!plan ? (
                <div className="no-plan-area">
                  <p className="text-muted">No plan drafted yet for this student.</p>
                  <button className="btn-primary" onClick={handleGenerateDraft} disabled={isGenerating}>
                    {isGenerating ? 'Generatingâ¦' : 'â¡ Generate Draft Plan'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Plan header */}
                  <div className="plan-header-bar">
                    <div className="plan-meta">
                      <span className="plan-week-of">Week of {formatDate(plan.weekOf)}</span>
                      {plan.weekNumber && (
                        <span className="plan-week-num text-muted">Week {plan.weekNumber}</span>
                      )}
                    </div>
                    <div className="plan-hours-summary">
                      <span className="plan-hours-total">
                        {hoursToLabel(totalPlannedHours)}
                        <span className="text-muted"> / {selectedStudent.weeklyHours || 20}h target</span>
                      </span>
                    </div>
                    <div className="plan-actions">
                      <button className="btn-ghost sm" onClick={() => setShowAddBlock(v => !v)}>
                        {showAddBlock ? 'â Cancel' : '+ Add Block'}
                      </button>
                      <button className="btn-ghost sm" onClick={handleGenerateDraft}>â» Regenerate</button>
                      <button className="btn-primary sm" onClick={handleSavePlan} disabled={isSaving}>
                        {isSaving ? 'Savingâ¦' : 'ð¾ Save Plan'}
                      </button>
                    </div>
                  </div>

                  {/* Section hours bar */}
                  <div className="section-hours-bar">
                    {SECTIONS.map(s => {
                      const h = sectionTotals[s] || 0;
                      if (!h) return null;
                      return (
                        <div key={s} className="sh-chip" style={{ borderColor: SECTION_COLORS[s] }}>
                          <span className="sh-section" style={{ color: SECTION_COLORS[s] }}>{s}</span>
                          <span className="sh-hours">{hoursToLabel(h)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add block form */}
                  {showAddBlock && (
                    <div className="add-block-form">
                      <h5>Add Block</h5>
                      <div className="add-block-grid">
                        <div className="form-field">
                          <label>Section</label>
                          <select value={newBlock.section} onChange={e => setNewBlock(p => ({ ...p, section: e.target.value }))}>
                            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="form-field">
                          <label>Hours</label>
                          <input type="number" min="0.25" max="8" step="0.25" value={newBlock.hours}
                            onChange={e => setNewBlock(p => ({ ...p, hours: e.target.value }))} />
                        </div>
                        <div className="form-field">
                          <label>Priority</label>
                          <select value={newBlock.priority} onChange={e => setNewBlock(p => ({ ...p, priority: e.target.value }))}>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-field" style={{ marginBottom: '0.5rem' }}>
                        <label>Topics</label>
                        <input type="text" value={newBlock.topics}
                          onChange={e => setNewBlock(p => ({ ...p, topics: e.target.value }))}
                          placeholder="e.g. Resonance, SN2" />
                      </div>
                      <div className="form-actions">
                        <button className="btn-ghost sm" onClick={() => setShowAddBlock(false)}>Cancel</button>
                        <button className="btn-primary sm" onClick={handleAddBlock}>Add</button>
                      </div>
                    </div>
                  )}

                  {/* Plan blocks */}
                  <div className="plan-blocks-list">
                    {plan.blocks.map(block => (
                      <div key={block.id} className="plan-block-wrapper">
                        <PlanBlock block={block} onEdit={handleEditBlock} />
                        <button className="remove-block-btn text-muted" onClick={() => handleRemoveBlock(block.id)} title="Remove">â</button>
                      </div>
                    ))}
                  </div>

                  {/* Plan notes */}
                  <div className="plan-notes-area">
                    <label className="form-label">Coach Notes for This Week</label>
                    <textarea
                      className="plan-notes-input"
                      value={plan.notes || ''}
                      onChange={e => setPlan(p => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      placeholder="Overall strategy, reminders, or instructions for this weekâ¦"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ââ SCORES TAB ââ */}
          {activeTab === 'scores' && (
            <div className="scores-tab">
              <div className="scores-header">
                <h4>Score Overview</h4>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Based on latest check-in. Scores on 200â600 scale.
                </p>
              </div>

              {Object.keys(currentScores).length === 0 ? (
                <div className="empty-state">
                  <p>No check-in scores recorded yet.</p>
                </div>
              ) : (
                <div className="score-bars-list">
                  {SECTIONS.map(s => {
                    const d = scoreDeltas[s];
                    if (!d) return null;
                    return (
                      <ScoreBar key={s} section={s} current={d.current} target={d.target} />
                    );
                  })}
                </div>
              )}

              {/* Gap table */}
              <div className="gap-table-wrap">
                <h5 className="gap-table-title">Gap Analysis</h5>
                <table className="gap-table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Current</th>
                      <th>Target</th>
                      <th>Gap</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SECTIONS.map(s => {
                      const d = scoreDeltas[s];
                      const gap = d.gap;
                      const priority = gap > 50 ? 'high' : gap > 20 ? 'medium' : 'low';
                      return (
                        <tr key={s}>
                          <td style={{ color: SECTION_COLORS[s], fontWeight: 600 }}>{s}</td>
                          <td>{d.current}</td>
                          <td style={{ color: SECTION_COLORS[s] }}>{d.target}</td>
                          <td style={{ color: PRIORITY_COLORS[priority], fontWeight: 600 }}>
                            {gap > 0 ? `+${gap}` : gap}
                          </td>
                          <td>
                            <span className="priority-badge" style={{
                              background: PRIORITY_COLORS[priority] + '22',
                              color: PRIORITY_COLORS[priority],
                              border: `1px solid ${PRIORITY_COLORS[priority]}`,
                            }}>{priority}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ââ HISTORY TAB ââ */}
          {activeTab === 'history' && (
            <div className="history-tab">
              {historicalPlans.length === 0 ? (
                <div className="empty-state">
                  <p>No saved plans yet. Generate and save a plan to see history.</p>
                </div>
              ) : (
                <div className="history-list">
                  {historicalPlans.map((hp, i) => (
                    <div key={hp.id || i} className="history-card">
                      <div className="history-card-header">
                        <span className="history-week">Week of {formatDate(hp.weekOf)}</span>
                        {hp.weekNumber && <span className="history-wnum text-muted">Week {hp.weekNumber}</span>}
                        <span className="history-hours text-muted">
                          {hoursToLabel(hp.blocks?.reduce((s, b) => s + (b.hours || 0), 0) || 0)} planned
                        </span>
                      </div>
                      <div className="history-blocks">
                        {(hp.blocks || []).map((b, j) => (
                          <span key={j} className="history-block-chip" style={{
                            borderColor: SECTION_COLORS[b.section] || '#888',
                            color: SECTION_COLORS[b.section] || '#888',
                          }}>
                            {b.section} {hoursToLabel(b.hours)}
                          </span>
                        ))}
                      </div>
                      {hp.notes && <p className="history-notes text-muted">{hp.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {editingBlock && (
        <EditBlockModal
          block={editingBlock}
          onSave={handleSaveBlock}
          onCancel={() => setEditingBlock(null)}
        />
      )}

      <style>{`
        .cph-page {
          max-width: 860px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .cph-header { margin-bottom: 1.5rem; }
        .cph-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .cph-title-row h2 { margin: 0; font-size: 1.6rem; }
        .save-msg {
          font-size: 0.85rem;
          color: #10b981;
          font-weight: 600;
          animation: fadeIn 0.2s;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .student-selector-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .selector-label { font-size: 0.875rem; font-weight: 600; color: var(--text-muted); }
        .student-select {
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.9rem;
          cursor: pointer;
          min-width: 200px;
        }
        .cph-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
        }
        .cph-tab {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.15s;
        }
        .cph-tab.active {
          color: var(--accent-blue);
          border-bottom-color: var(--accent-blue);
        }
        .cph-tab:hover:not(.active) { color: var(--text-primary); }
        .student-summary-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .ss-row { display: flex; gap: 2rem; flex-wrap: wrap; }
        .ss-field { display: flex; flex-direction: column; gap: 0.1rem; }
        .ss-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .ss-val { font-size: 0.95rem; font-weight: 600; }
        .no-plan-area {
          text-align: center;
          padding: 3rem 1rem;
          background: var(--surface-1);
          border: 1px dashed var(--border);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .plan-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .plan-meta { display: flex; align-items: center; gap: 0.75rem; }
        .plan-week-of { font-size: 1rem; font-weight: 700; }
        .plan-week-num { font-size: 0.8rem; }
        .plan-hours-total { font-size: 0.9rem; font-weight: 600; }
        .plan-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .section-hours-bar {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .sh-chip {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          border: 1px solid;
          border-radius: 20px;
          background: var(--surface-1);
        }
        .sh-section { font-size: 0.78rem; font-weight: 700; }
        .sh-hours { font-size: 0.78rem; color: var(--text-secondary); }
        .add-block-form {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .add-block-form h5 { margin: 0 0 0.75rem; font-size: 0.9rem; }
        .add-block-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .plan-blocks-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .plan-block-wrapper {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .plan-block {
          flex: 1;
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-left: 3px solid;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          position: relative;
        }
        .plan-block-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }
        .plan-block-section { font-weight: 700; font-size: 0.9rem; }
        .plan-block-hours { font-size: 0.85rem; color: var(--text-secondary); }
        .plan-block-priority { font-size: 0.78rem; font-weight: 600; }
        .plan-block-topics {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          margin-bottom: 0.3rem;
        }
        .plan-block-topic {
          font-size: 0.72rem;
          background: var(--surface-3);
          border-radius: 4px;
          padding: 0.1rem 0.4rem;
          color: var(--text-secondary);
        }
        .plan-block-notes {
          margin: 0.25rem 0 0;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-style: italic;
          line-height: 1.4;
        }
        .plan-block-edit-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .plan-block-edit-btn:hover { opacity: 1; }
        .remove-block-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0.25rem;
          opacity: 0.4;
          transition: opacity 0.15s;
          margin-top: 0.75rem;
          flex-shrink: 0;
        }
        .remove-block-btn:hover { opacity: 1; }
        .plan-notes-area { margin-top: 0.5rem; }
        .form-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.35rem; }
        .plan-notes-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.875rem;
          resize: vertical;
          box-sizing: border-box;
        }
        /* Scores tab */
        .scores-tab { display: flex; flex-direction: column; gap: 1.25rem; }
        .scores-header h4 { margin: 0; font-size: 1rem; }
        .score-bars-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .score-bar-wrap { display: flex; flex-direction: column; gap: 0.3rem; }
        .score-bar-labels {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .score-bar-section { font-weight: 700; }
        .score-bar-vals { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; }
        .score-current { font-weight: 600; color: var(--text-secondary); }
        .score-arrow { color: var(--text-muted); }
        .score-target { font-weight: 700; }
        .score-bar-track {
          height: 8px;
          border-radius: 4px;
          background: var(--surface-3);
          position: relative;
          overflow: visible;
        }
        .score-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s;
        }
        .score-bar-target-line {
          position: absolute;
          top: -3px;
          height: 14px;
          width: 0;
          border-left: 2px dashed;
          border-radius: 1px;
        }
        .gap-table-wrap { margin-top: 0.5rem; }
        .gap-table-title { margin: 0 0 0.75rem; font-size: 0.9rem; }
        .gap-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .gap-table th {
          text-align: left;
          padding: 0.4rem 0.75rem;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
        }
        .gap-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .priority-badge {
          padding: 0.15rem 0.5rem;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 600;
        }
        /* History tab */
        .history-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .history-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1rem;
        }
        .history-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.6rem;
          flex-wrap: wrap;
        }
        .history-week { font-weight: 700; font-size: 0.9rem; }
        .history-wnum { font-size: 0.8rem; }
        .history-hours { font-size: 0.8rem; }
        .history-blocks { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
        .history-block-chip {
          font-size: 0.72rem;
          font-weight: 600;
          border: 1px solid;
          border-radius: 12px;
          padding: 0.1rem 0.5rem;
          background: var(--surface-2);
        }
        .history-notes { margin: 0; font-size: 0.8rem; font-style: italic; }
        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .modal-title { margin: 0 0 1rem; font-size: 1rem; }
        .modal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
        /* Shared */
        .form-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-field label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
        .form-field input, .form-field select, .form-field textarea {
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .form-field textarea { resize: vertical; }
        .form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-muted);
          background: var(--surface-1);
          border: 1px dashed var(--border);
          border-radius: 10px;
        }
        .btn-primary {
          padding: 0.5rem 1rem;
          background: var(--accent-blue);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary.sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          padding: 0.5rem 1rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-ghost.sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
        .btn-ghost:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
        .text-muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export { CoachPlanningHub };
