import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, ArrowRight, UserPlus, X, Copy, Check } from 'lucide-react';

export function CoachDashboard() {
  const { session, students, addStudent } = usePortal();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', program: 'Accelerator', targetScore: 20, testDate: '' });
  const [justAdded, setJustAdded] = useState(null);
  const [copied, setCopied] = useState('');

  const activeStudents = students.filter(s => s.status === 'Active');
  const totalStudents = students.length;
  const avgPredicted = totalStudents > 0 ? Math.round(students.reduce((a, s) => a + s.predicted, 0) / totalStudents) : 0;
  const avgTarget = totalStudents > 0 ? Math.round(students.reduce((a, s) => a + s.targetScore, 0) / totalStudents) : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.email.trim()) return;
    const result = addStudent(newStudent);
    setJustAdded(result);
    setNewStudent({ name: '', email: '', program: 'Accelerator', targetScore: 20, testDate: '' });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="animate-in">
      {/* Coach Header */}
      <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-xl)', padding: '32px 36px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 16 }}>
          Ace The DAT \u00b7 Coaching OS
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.5px', marginBottom: 6 }}>
          Welcome back, {session?.name || 'Coach'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-lo)', lineHeight: 1.6 }}>
          {activeStudents.length} active student{activeStudents.length !== 1 ? 's' : ''} \u00b7 {totalStudents} total enrolled
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid stat-grid-4">
        <div className="stat-card">
          <div className="stat-card-label">Active Students</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{activeStudents.length}</div>
          <div className="stat-card-sub">currently enrolled</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Avg Predicted</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{avgPredicted}</div>
          <div className="stat-card-sub">across all students</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Avg Target</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{avgTarget}</div>
          <div className="stat-card-sub">goal score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Gap to Close</div>
          <div className="stat-card-value" style={{ color: avgTarget - avgPredicted > 3 ? 'var(--danger)' : 'var(--success)' }}>
            {avgTarget - avgPredicted}
          </div>
          <div className="stat-card-sub">avg points</div>
        </div>
      </div>

      {/* Student Roster */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={16} style={{ color: 'var(--gold)' }} />
            <span className="panel-title">Student Roster</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-gold" onClick={() => { setShowAdd(true); setJustAdded(null); }} style={{ fontSize: 12, padding: '6px 14px', gap: 6 }}>
              <UserPlus size={13} /> Add Student
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/coach/students')}>
              View All <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {students.map(student => {
            const gap = student.targetScore - student.predicted;
            return (
              <div key={student.id} style={{
                padding: '16px 18px', borderRadius: 12,
                background: 'var(--bg-panel-hover)', border: '1px solid var(--border)',
                display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
                cursor: 'pointer', transition: 'border-color 0.15s'
              }}
              onClick={() => navigate('/coach/students')}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `${student.color}20`, border: `1.5px solid ${student.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: student.color
                }}>
                  {student.initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 3 }}>
                    {student.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag tag-gold">{student.program}</span>
                    <span className="tag tag-muted">{student.phase}</span>
                    <span className={`tag ${student.status === 'Active' ? 'tag-success' : 'tag-muted'}`}>
                      {student.status}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
                    {student.predicted || '\u2014'}
                  </div>
                  <div style={{ fontSize: 11, color: gap > 3 ? 'var(--danger)' : gap > 0 ? 'var(--success)' : 'var(--text-muted)', marginTop: 3 }}>
                    {student.predicted ? (gap > 0 ? `${gap} pts to go` : 'On target') : 'No data yet'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowAdd(false)}>
          <div style={{
            background: 'var(--bg-panel)', border: '1px solid var(--gold-border)',
            borderRadius: 16, padding: 0, width: '100%', maxWidth: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)' }}>
                  {justAdded ? 'Student Created' : 'Add New Student'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 2 }}>
                  {justAdded ? 'Share these credentials with your student' : 'Set up a new student portal'}
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Success State — Show Credentials */}
            {justAdded ? (
              <div style={{ padding: '24px' }}>
                <div style={{
                  background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
                  borderRadius: 10, padding: '16px 18px', marginBottom: 20
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>
                    \u2713 {justAdded.student.name}'s portal is ready
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                    They can sign in at acethedat-portal.netlify.app
                  </div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Login Credentials
                </div>

                {/* Email row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 8, marginBottom: 8
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Email</div>
                    <div style={{ fontSize: 13, color: 'var(--text-hi)', fontFamily: 'monospace' }}>{justAdded.credentials.email}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(justAdded.credentials.email, 'email')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'email' ? 'var(--success)' : 'var(--text-lo)', padding: 6, display: 'flex' }}
                  >
                    {copied === 'email' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Password row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 8, marginBottom: 20
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Password</div>
                    <div style={{ fontSize: 13, color: 'var(--text-hi)', fontFamily: 'monospace' }}>{justAdded.credentials.password}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(justAdded.credentials.password, 'pw')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'pw' ? 'var(--success)' : 'var(--text-lo)', padding: 6, display: 'flex' }}
                  >
                    {copied === 'pw' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-gold"
                    onClick={() => {
                      const text = `Your Ace The DAT portal is ready!\n\nSign in at: acethedat-portal.netlify.app\nEmail: ${justAdded.credentials.email}\nPassword: ${justAdded.credentials.password}`;
                      copyToClipboard(text, 'all');
                    }}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12.5 }}
                  >
                    {copied === 'all' ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy All</>}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setJustAdded(null); }} style={{ fontSize: 12.5 }}>
                    Add Another
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ fontSize: 12.5 }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleAdd} style={{ padding: '24px' }}>
                {/* Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 5 }}>
                    Student Name *
                  </label>
                  <input
                    className="form-input"
                    placeholder="e.g. Sarah"
                    value={newStudent.name}
                    onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))}
                    autoFocus
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 5 }}>
                    Student Email *
                  </label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="sarah@student.acethedat.com"
                    value={newStudent.email}
                    onChange={e => setNewStudent(s => ({ ...s, email: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Program + Target row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 5 }}>
                      Program
                    </label>
                    <select
                      className="form-select"
                      value={newStudent.program}
                      onChange={e => setNewStudent(s => ({ ...s, program: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Accelerator">Accelerator</option>
                      <option value="Elite Mastery">Elite Mastery</option>
                      <option value="Foundation">Foundation</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 5 }}>
                      Target Score
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      min="15"
                      max="30"
                      value={newStudent.targetScore}
                      onChange={e => setNewStudent(s => ({ ...s, targetScore: parseInt(e.target.value) || 20 }))}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Test Date */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 5 }}>
                    DAT Test Date
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={newStudent.testDate}
                    onChange={e => setNewStudent(s => ({ ...s, testDate: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                  A password will be auto-generated as <span style={{ fontFamily: 'monospace', color: 'var(--text-lo)' }}>AceDAT-{newStudent.name || 'Name'}</span>. You'll see it after creating.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={!newStudent.name.trim() || !newStudent.email.trim()}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '11px 0', gap: 8, opacity: (!newStudent.name.trim() || !newStudent.email.trim()) ? 0.4 : 1 }}
                  >
                    <UserPlus size={14} /> Create Student Portal
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ fontSize: 12.5 }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* System Rule */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', marginTop: 4
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase' }}>
          System Rule
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, fontWeight: 300 }}>
          Every session must produce at least one logged insight \u2014 not a student note, a pattern insight.
          After 20 students, this database becomes your moat. No competitor can replicate it.
        </div>
      </div>
    </div>
  );
}
