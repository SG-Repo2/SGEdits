import { useState } from 'react';
import { SECTIONS, ERROR_CATEGORIES } from '../../data/seedData';
import { usePortal } from '../../app/providers/PortalProvider';
import { ChevronDown, Edit, X, Plus, Check } from 'lucide-react';

function ScoreBar({ section, value, max = 600, color, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState(String(value));
  const pct = Math.round(((value - 200) / (max - 200)) * 100);
  const barColor = color || (value >= 400 ? 'var(--success)' : value >= 350 ? 'var(--gold)' : 'var(--danger)');

  const handleSave = () => {
    const num = parseInt(newValue, 10);
    if (!isNaN(num) && num >= 0 && num <= max) {
      onEdit(section, num);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-lo)', minWidth: 60 }}>{section}</div>
        <input type="number" min="0" max={max} value={newValue} onChange={e => setNewValue(e.target.value)}
          style={{ width: 50, padding: '4px 6px', borderRadius: 4, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-hi)', fontSize: 12 }} />
        <button onClick={handleSave} style={{ padding: '4px 8px', background: 'var(--gold)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Save</button>
        <button onClick={() => setEditing(false)} style={{ padding: '4px 8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: 'var(--text-mid)' }}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="score-bar" onClick={() => setEditing(true)} style={{ cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.2s' }}>
      <div className="score-bar-label">{section}</div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="score-bar-value">{value}</div>
    </div>
  );
}

function StudentProfile({ student }) {
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(student.coachNote || '');
  const [addingWeakArea, setAddingWeakArea] = useState(false);
  const [newWeakArea, setNewWeakArea] = useState('');
  const [addingFocusTag, setAddingFocusTag] = useState(false);
  const [newFocusTag, setNewFocusTag] = useState('');
  const { mqlErrors, updateStudent, updateStudentSections, weeklyPlans } = usePortal();

  const sectionAvg = Math.round(Object.values(student.sections).reduce((a, b) => a + b, 0) / Object.keys(student.sections).length);
  const gap = student.targetAA - student.predicted;
  const hasPlan = !!weeklyPlans[student.id];

  // Error category breakdown from MQL â filter by this student
  const studentErrors = mqlErrors.filter(e => e.studentId === student.id);
  const catCounts = {};
  Object.keys(ERROR_CATEGORIES).forEach(k => {
    catCounts[k] = studentErrors.filter(e => e.category === String(k)).length;
  });

  // Handlers for inline editing
  const handleSaveNote = () => {
    updateStudent(student.id, { coachNote: noteValue });
    setEditingNote(false);
  };

  const handleAddWeakArea = () => {
    if (newWeakArea.trim()) {
      const updated = [...student.weakAreas, newWeakArea.trim()];
      updateStudent(student.id, { weakAreas: updated });
      setNewWeakArea('');
      setAddingWeakArea(false);
    }
  };

  const handleRemoveWeakArea = (area) => {
    const updated = student.weakAreas.filter(a => a !== area);
    updateStudent(student.id, { weakAreas: updated });
  };

  const handleAddFocusTag = () => {
    if (newFocusTag.trim()) {
      const updated = [...(student.focusTags || []), newFocusTag.trim()];
      updateStudent(student.id, { focusTags: updated });
      setNewFocusTag('');
      setAddingFocusTag(false);
    }
  };

  const handleRemoveFocusTag = (tag) => {
    const updated = (student.focusTags || []).filter(t => t !== tag);
    updateStudent(student.id, { focusTags: updated });
  };

  const handleSectionScore = (section, newValue) => {
    const updated = { ...student.sections, [section]: newValue };
    updateStudentSections(student.id, updated);
  };

  return (
    <div className={`sec-card ${open ? 'open' : ''}`} style={{ borderColor: `${student.color}30` }}>
      <div className="sec-card-header" onClick={() => setOpen(!open)} style={{ background: `${student.color}08` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `${student.color}20`, border: `1.5px solid ${student.color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 700, color: student.color, flexShrink: 0
          }}>
            {student.initials}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 2 }}>{student.name}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="tag tag-gold">{student.program}</span>
              <span className="tag tag-muted">{student.phase}</span>
              <span className={`tag ${student.status === 'Active' ? 'tag-success' : 'tag-muted'}`}>{student.status}</span>
              <span className={`tag ${hasPlan ? 'tag-success' : 'tag-muted'}`}>{hasPlan ? 'â Has plan' : 'No plan'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{student.predicted}</div>
            <div style={{ fontSize: 10, color: gap > 30 ? 'var(--danger)' : 'var(--success)', marginTop: 2 }}>
              target: {student.targetAA}
            </div>
          </div>
          <ChevronDown size={16} style={{ color: 'var(--text-lo)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </div>
      </div>
      <div className="sec-card-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Section Scores */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Section Performance
            </div>
            {Object.entries(student.sections).map(([sec, val]) => (
              <ScoreBar key={sec} section={sec} value={val} onEdit={handleSectionScore} />
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>Section Average</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{sectionAvg}</span>
            </div>
          </div>

          {/* Profile Info */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Student Profile
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Test Date', value: student.testDate },
                { label: 'Predicted', value: student.predicted, color: 'var(--gold)' },
                { label: 'Ceiling', value: student.ceiling, color: 'var(--success)' },
                { label: 'Target', value: student.targetAA },
                { label: 'Gap', value: `${gap} pts`, color: gap > 30 ? 'var(--danger)' : 'var(--success)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color || 'var(--text-hi)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weak Areas */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Key Weak Areas</span>
            {!addingWeakArea && <button onClick={() => setAddingWeakArea(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold)' }}><Plus size={14} /> Add</button>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: addingWeakArea ? 10 : 0 }}>
            {student.weakAreas.map(area => (
              <span key={area} className="tag tag-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 6 }}>
                {area}
                <button onClick={() => handleRemoveWeakArea(area)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
              </span>
            ))}
          </div>
          {addingWeakArea && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input type="text" value={newWeakArea} onChange={e => setNewWeakArea(e.target.value)} placeholder="e.g. Organic Chemistry"
                style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-hi)', fontSize: 12 }} />
              <button onClick={handleAddWeakArea} style={{ padding: '6px 12px', background: 'var(--gold)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}><Check size={14} /></button>
              <button onClick={() => setAddingWeakArea(false)} style={{ padding: '6px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: 'var(--text-mid)' }}><X size={14} /></button>
            </div>
          )}
        </div>

        {/* Coach Note */}
        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 10, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Coach Note</span>
            {!editingNote && <button onClick={() => setEditingNote(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold-dim)' }}><Edit size={14} /></button>}
          </div>
          {editingNote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea value={noteValue} onChange={e => setNoteValue(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--gold-border)', color: 'var(--text-hi)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, minHeight: 80 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSaveNote} style={{ padding: '6px 12px', background: 'var(--gold)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Save</button>
                <button onClick={() => { setEditingNote(false); setNoteValue(student.coachNote || ''); }} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--gold-border)', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: 'var(--gold-dim)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, fontWeight: 300, whiteSpace: 'pre-line', minHeight: 40 }}>
                {noteValue || <span style={{ color: 'var(--text-lo)', fontStyle: 'italic' }}>No note yet. Click Edit to add one.</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, alignItems: 'flex-start' }}>
                {student.focusTags?.map(tag => (
                  <span key={tag} className="tag tag-gold" style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 6 }}>
                    {tag}
                    <button onClick={() => handleRemoveFocusTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                  </span>
                ))}
                {addingFocusTag ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input type="text" value={newFocusTag} onChange={e => setNewFocusTag(e.target.value)} placeholder="e.g. Timing"
                      style={{ padding: '4px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--gold-border)', color: 'var(--text-hi)', fontSize: 11 }} />
                    <button onClick={handleAddFocusTag} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 3, cursor: 'pointer', color: 'var(--gold-dim)' }}><Check size={12} /></button>
                    <button onClick={() => setAddingFocusTag(false)} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 3, cursor: 'pointer', color: 'var(--gold-dim)' }}><X size={12} /></button>
                  </div>
                ) : (
                  student.focusTags && student.focusTags.length < 5 && (
                    <button onClick={() => setAddingFocusTag(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold-dim)' }}><Plus size={12} /> Tag</button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CoachStudents() {
  const { students } = usePortal();

  return (
    <div className="animate-in">
      <div className="section-header">
        <div className="section-header-title">Students</div>
        <div className="section-header-sub">Full profiles, section scores, and coaching notes for every enrolled student.</div>
      </div>
      {students.map(student => (
        <StudentProfile key={student.id} student={student} />
      ))}
    </div>
  );
}
