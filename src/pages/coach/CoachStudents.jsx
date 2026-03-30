import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SECTIONS, ERROR_CATEGORIES } from '../../data/seedData';
import { usePortal } from '../../app/providers/PortalProvider';
import { ChevronDown, Edit, X, Plus, Check, UserPlus, Copy, Eye, EyeOff } from 'lucide-react';

function ScoreBar({ section, value, max = 600, color, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState(String(value ?? 0));
  const pct = Math.round((((value ?? 0) - 200) / (max - 200)) * 100);
  const barColor = color || ((value ?? 0) >= 400 ? 'var(--success)' : (value ?? 0) >= 350 ? 'var(--gold)' : 'var(--danger)');
  const handleSave = () => {
    const num = parseInt(newValue, 10);
    if (!isNaN(num) && num >= 0 && num <= max) { onEdit(section, num); setEditing(false); }
  };
  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-lo)', minWidth: 60 }}>{section}</div>
        <input type="number" min="0" max={max} value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} style={{ width: 50, padding: '4px 6px', borderRadius: 4, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-hi)', fontSize: 12 }} />
        <button onClick={handleSave} style={{ padding: '4px 8px', background: 'var(--gold)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Save</button>
        <button onClick={() => setEditing(false)} style={{ padding: '4px 8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: 'var(--text-mid)' }}>Cancel</button>
      </div>
    );
  }
  return (
    <div className="score-bar" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
      <div className="score-bar-label">{section}</div>
      <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${Math.max(0, pct)}%`, background: barColor }} /></div>
      <div className="score-bar-value">{value ?? '—'}</div>
    </div>
  );
}

const PROGRAMS = ['Full DAT','DAT Biology','DAT General Chemistry','DAT Organic Chemistry','Mixed/Full DAT','Post-DAT Application','Strategy/Schedule'];
const PHASES = ['Foundation','Practice','Peak','Test Week','Post-DAT'];

function AddStudentModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', testDate:'', targetAA:22, program:'Full DAT', phase:'Foundation' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Valid email is required.'); return; }
    setError(''); setLoading(true);
    const res = await onAdd(form);
    setLoading(false);
    if (!res.success) { setError(res.error || 'Failed to create student.'); } else { setResult({ tempPassword: res.tempPassword, authUserCreated: res.authUserCreated !== false, name: form.name }); }
  };
  const copyPassword = () => {
    if (result?.tempPassword) { navigator.clipboard.writeText(result.tempPassword); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const inp = { padding: '9px 12px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-hi)', fontSize: 13, width: '100%', boxSizing: 'border-box' };

  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 20px', overflowY: 'auto' }}
    >
      <div style={{ background: 'var(--bg-panel)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, border: '1px solid var(--border)', flexShrink: 0 }}>
        {!result ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-hi)' }}>Add New Student</div>
                <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 3 }}>Add a new student to the portal.</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-lo)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Full Name *', 'name', 'text', 'e.g. Merna Youssef'], ['Email *', 'email', 'email', 'student@email.com'], ['Phone', 'phone', 'tel', '(555) 555-5555']].map(([label, field, type, placeholder]) => (
                <div key={field}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input style={inp} type={type} placeholder={placeholder} value={form[field]} onChange={e => set(field, e.target.value)} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>DAT Test Date</label>
                  <input style={inp} type="date" value={form.testDate} onChange={e => set('testDate', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Target AA</label>
                  <input style={inp} type="number" min="18" max="30" value={form.targetAA} onChange={e => set('targetAA', parseInt(e.target.value, 10) || 22)} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Program</label>
                <select style={inp} value={form.program} onChange={e => set('program', e.target.value)}>{PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Starting Phase</label>
                <select style={inp} value={form.phase} onChange={e => set('phase', e.target.value)}>{PHASES.map(p => <option key={p} value={p}>{p}</option>)}</select>
              </div>
            </div>
            {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px 0', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-mid)', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '11px 0', background: loading ? 'var(--gold-dim)' : 'var(--gold)', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>{loading ? 'Creating account…' : 'Create Student Account'}</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 6 }}>Account Created for {result.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>No email was sent. Share this temporary password with the student directly.</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 8 }}>Temporary Password</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 16, color: 'var(--text-hi)', letterSpacing: '2px' }}>{showPass ? result.tempPassword : '••••••••••••'}</div>
                <button onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-dim)', padding: 4 }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                <button onClick={copyPassword} style={{ padding: '6px 12px', background: copied ? 'var(--success)' : 'var(--gold)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 4 }}><Copy size={13} /> {copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.6, marginBottom: 20 }}>Student can log in at <strong style={{ color: 'var(--gold-dim)' }}>acethedat-portal.netlify.app</strong> with their email and this password.</div>
            <button onClick={onClose} style={{ width: '100%', padding: '12px 0', background: 'var(--gold)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>Done</button>
          </>
        )}
      </div>
    </div>,
    document.body
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
  const sections = student.sections || {};
  const weakAreas = student.weakAreas || [];
  const focusTags = student.focusTags || [];
  const hasSections = Object.keys(sections).length > 0;
  const sectionAvg = hasSections ? Math.round(Object.values(sections).reduce((a, b) => a + (b || 0), 0) / Object.keys(sections).length) : 0;
  const gap = (student.targetAA || 22) - (student.predicted || 0);
  const hasPlan = !!(weeklyPlans || {})[student.id];
  const studentErrors = (mqlErrors || []).filter(e => e.studentId === student.id);
  const handleSaveNote = () => { updateStudent(student.id, { coachNote: noteValue }); setEditingNote(false); };
  const handleAddWeakArea = () => { if (newWeakArea.trim()) { updateStudent(student.id, { weakAreas: [...weakAreas, newWeakArea.trim()] }); setNewWeakArea(''); setAddingWeakArea(false); } };
  const handleRemoveWeakArea = (area) => { updateStudent(student.id, { weakAreas: weakAreas.filter(a => a !== area) }); };
  const handleAddFocusTag = () => { if (newFocusTag.trim()) { updateStudent(student.id, { focusTags: [...focusTags, newFocusTag.trim()] }); setNewFocusTag(''); setAddingFocusTag(false); } };
  const handleRemoveFocusTag = (tag) => { updateStudent(student.id, { focusTags: focusTags.filter(t => t !== tag) }); };
  const handleSectionScore = (section, newValue) => { updateStudentSections(student.id, { ...sections, [section]: newValue }); };
  const testDateCountdown = (() => {
    if (!student.testDate) return null;
    const diff = Math.round((new Date(student.testDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Passed';
    if (diff === 0) return 'TODAY';
    return `${diff}d`;
  })();
  return (
    <div className={`sec-card ${open ? 'open' : ''}`} style={{ borderColor: `${student.color || '#C9A84C'}30`, marginBottom: 12 }}>
      <div className="sec-card-header" onClick={() => setOpen(!open)} style={{ background: `${student.color || '#C9A84C'}08` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${student.color || '#C9A84C'}20`, border: `1.5px solid ${student.color || '#C9A84C'}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: student.color || '#C9A84C', flexShrink: 0 }}>
            {student.initials || student.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 2 }}>{student.name}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="tag tag-gold">{student.program || 'Full DAT'}</span>
              <span className="tag tag-muted">{student.phase || 'Foundation'}</span>
              <span className={`tag ${hasPlan ? 'tag-success' : 'tag-muted'}`}>{hasPlan ? '✓ Has plan' : 'No plan'}</span>
              {testDateCountdown && <span className={`tag ${testDateCountdown === 'TODAY' ? 'tag-danger' : 'tag-muted'}`}>{testDateCountdown === 'Passed' ? '🎓 Done' : `📅 ${testDateCountdown}`}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{student.predicted ?? '—'}</div>
            <div style={{ fontSize: 10, color: gap > 30 ? 'var(--danger)' : 'var(--success)', marginTop: 2 }}>target: {student.targetAA || 22}</div>
          </div>
          <ChevronDown size={16} style={{ color: 'var(--text-lo)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </div>
      </div>
      {open && (
        <div className="sec-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Section Performance</div>
              {hasSections ? Object.entries(sections).map(([sec, val]) => <ScoreBar key={sec} section={sec} value={val} onEdit={handleSectionScore} />) : <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No scores yet</div>}
              {hasSections && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}><span style={{ fontSize: 12, color: 'var(--text-lo)' }}>Section Average</span><span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{sectionAvg}</span></div>}
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Student Profile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[['Email', student.email], ['Phone', student.phone || '—'], ['Test Date', student.testDate || '—'], ['Predicted', student.predicted ?? '—', 'var(--gold)'], ['Ceiling', student.ceiling ?? '—', 'var(--success)'], ['Target AA', student.targetAA || 22], ['Gap', `${gap} pts`, gap > 30 ? 'var(--danger)' : 'var(--success)']].map(([label, value, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: color || 'var(--text-hi)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Key Weak Areas</span>
              {!addingWeakArea && <button onClick={() => setAddingWeakArea(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold)' }}><Plus size={14} /> Add</button>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: addingWeakArea ? 10 : 0 }}>
              {weakAreas.map(area => (<span key={area} className="tag tag-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 6 }}>{area}<button onClick={() => handleRemoveWeakArea(area)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}><X size={12} /></button></span>))}
              {weakAreas.length === 0 && !addingWeakArea && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None added yet</span>}
            </div>
            {addingWeakArea && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input type="text" value={newWeakArea} onChange={e => setNewWeakArea(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddWeakArea()} placeholder="e.g. Organic Chemistry" style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-hi)', fontSize: 12 }} />
                <button onClick={handleAddWeakArea} style={{ padding: '6px 12px', background: 'var(--gold)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}><Check size={14} /></button>
                <button onClick={() => setAddingWeakArea(false)} style={{ padding: '6px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: 'var(--text-mid)' }}><X size={14} /></button>
              </div>
            )}
          </div>
          <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 10, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Coach Note</span>
              {!editingNote && <button onClick={() => setEditingNote(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold-dim)' }}><Edit size={14} /></button>}
            </div>
            {editingNote ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea value={noteValue} onChange={e => setNoteValue(e.target.value)} style={{ padding: '8px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--gold-border)', color: 'var(--text-hi)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, minHeight: 80 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleSaveNote} style={{ padding: '6px 12px', background: 'var(--gold)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Save</button>
                  <button onClick={() => { setEditingNote(false); setNoteValue(student.coachNote || ''); }} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--gold-border)', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: 'var(--gold-dim)' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, fontWeight: 300, whiteSpace: 'pre-line', minHeight: 40 }}>{noteValue || <span style={{ color: 'var(--text-lo)', fontStyle: 'italic' }}>No note yet. Click Edit to add one.</span>}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, alignItems: 'flex-start' }}>
                  {focusTags.map(tag => (<span key={tag} className="tag tag-gold" style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 6 }}>{tag}<button onClick={() => handleRemoveFocusTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}><X size={12} /></button></span>))}
                  {addingFocusTag ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input type="text" value={newFocusTag} onChange={e => setNewFocusTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFocusTag()} placeholder="e.g. Timing" style={{ padding: '4px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--gold-border)', color: 'var(--text-hi)', fontSize: 11 }} />
                      <button onClick={handleAddFocusTag} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 3, cursor: 'pointer', color: 'var(--gold-dim)' }}><Check size={12} /></button>
                      <button onClick={() => setAddingFocusTag(false)} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 3, cursor: 'pointer', color: 'var(--gold-dim)' }}><X size={12} /></button>
                    </div>
                  ) : focusTags.length < 6 && (
                    <button onClick={() => setAddingFocusTag(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold-dim)' }}><Plus size={12} /> Tag</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CoachStudents() {
  const { students, addStudent, loading } = usePortal();
  const [showAddModal, setShowAddModal] = useState(false);
  const safeStudents = Array.isArray(students) ? students : [];
  const handleAdd = useCallback(async (formData) => {
    if (!addStudent) return { success: false, error: 'addStudent not available.' };
    return await addStudent(formData);
  }, [addStudent]);
  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-header-title">Students</div>
          <div className="section-header-sub">{safeStudents.length > 0 ? `${safeStudents.length} student${safeStudents.length !== 1 ? 's' : ''} enrolled` : 'Full profiles, section scores, and coaching notes.'}</div>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
          <UserPlus size={15} /> Add Student
        </button>
      </div>
      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading students…</div>}
      {!loading && safeStudents.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>No students yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-lo)', marginBottom: 20 }}>Click "Add Student" to create your first student account.</div>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 24px', background: 'var(--gold)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>Add First Student</button>
        </div>
      )}
      {safeStudents.map(student => <StudentProfile key={student.id} student={student} />)}
      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
    </div>
  );
                    }
