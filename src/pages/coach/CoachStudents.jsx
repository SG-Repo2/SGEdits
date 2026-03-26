import { useState } from 'react';
import { demoStudents, SECTIONS, ERROR_CATEGORIES } from '../../data/seedData';
import { usePortal } from '../../app/providers/PortalProvider';
import { ChevronDown } from 'lucide-react';

function ScoreBar({ section, value, max = 30, color }) {
  const pct = Math.round((value / max) * 100);
  const barColor = color || (value >= 20 ? 'var(--success)' : value >= 17 ? 'var(--gold)' : 'var(--danger)');
  return (
    <div className="score-bar">
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
  const { mqlErrors } = usePortal();

  const sectionAvg = Math.round(Object.values(student.sections).reduce((a, b) => a + b, 0) / Object.keys(student.sections).length);
  const gap = student.targetScore - student.predicted;

  // Error category breakdown from MQL
  const studentErrors = mqlErrors.filter(e => true); // In production, filter by student
  const catCounts = {};
  Object.keys(ERROR_CATEGORIES).forEach(k => {
    catCounts[k] = studentErrors.filter(e => e.category === String(k)).length;
  });

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
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{student.predicted}</div>
            <div style={{ fontSize: 10, color: gap > 3 ? 'var(--danger)' : 'var(--success)', marginTop: 2 }}>
              target: {student.targetScore}
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
              <ScoreBar key={sec} section={sec} value={val} />
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
                { label: 'Target', value: student.targetScore },
                { label: 'Gap', value: `${gap} pts`, color: gap > 3 ? 'var(--danger)' : 'var(--success)' },
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
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Key Weak Areas
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {student.weakAreas.map(area => (
              <span key={area} className="tag tag-danger">{area}</span>
            ))}
          </div>
        </div>

        {/* Coach Note */}
        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 10, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 6 }}>
            Coach Note
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, fontWeight: 300, whiteSpace: 'pre-line' }}>
            {student.coachNote}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {student.focusTags?.map(tag => (
              <span key={tag} className="tag tag-gold">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoachStudents() {
  return (
    <div className="animate-in">
      <div className="section-header">
        <div className="section-header-title">Students</div>
        <div className="section-header-sub">Full profiles, section scores, and coaching notes for every enrolled student.</div>
      </div>
      {demoStudents.map(student => (
        <StudentProfile key={student.id} student={student} />
      ))}
    </div>
  );
}

