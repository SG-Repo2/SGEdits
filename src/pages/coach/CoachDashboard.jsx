import { usePortal } from '../../app/providers/PortalProvider';
import { useNavigate } from 'react-router-dom';
import { demoStudents } from '../../data/seedData';
import { Users, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';

export function CoachDashboard() {
  const { session } = usePortal();
  const navigate = useNavigate();

  const activeStudents = demoStudents.filter(s => s.status === 'Active');
  const totalStudents = demoStudents.length;
  const avgPredicted = Math.round(demoStudents.reduce((a, s) => a + s.predicted, 0) / totalStudents);
  const avgTarget = Math.round(demoStudents.reduce((a, s) => a + s.targetScore, 0) / totalStudents);

  return (
    <div className="animate-in">
      {/* Coach Header */}
      <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-xl)', padding: '32px 36px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 16 }}>
          Ace The DAT · Coaching OS
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.5px', marginBottom: 6 }}>
          Welcome back, {session?.name || 'Coach'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-lo)', lineHeight: 1.6 }}>
          {activeStudents.length} active student{activeStudents.length !== 1 ? 's' : ''} · {totalStudents} total enrolled
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
          <button className="btn btn-ghost" onClick={() => navigate('/coach/students')}>
            View All <ArrowRight size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {demoStudents.map(student => {
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
                    {student.predicted}
                  </div>
                  <div style={{ fontSize: 11, color: gap > 3 ? 'var(--danger)' : 'var(--success)', marginTop: 3 }}>
                    {gap > 0 ? `${gap} pts to go` : 'On target'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Rule */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', marginTop: 4
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase' }}>
          System Rule
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, fontWeight: 300 }}>
          Every session must produce at least one logged insight — not a student note, a pattern insight.
          After 20 students, this database becomes your moat. No competitor can replicate it.
        </div>
      </div>
    </div>
  );
}
