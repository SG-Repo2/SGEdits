import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';

export function LoginPage() {
  const { profiles, loginAsProfile } = usePortal();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  const coachProfile = profiles.find(p => p.role === 'coach');
  const studentProfiles = profiles.filter(p => p.role === 'student');

  const handleLogin = (profileId) => {
    loginAsProfile(profileId);
    const profile = profiles.find(p => p.id === profileId);
    navigate(profile?.homePath || '/');
  };

  return (
    <div className="login-page">
      <div className="login-container animate-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ivory)', marginBottom: 4 }}>
            Ace The <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>DAT</em>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-lo)' }}>
            Student Portal
          </div>
        </div>

        <div className="login-card">
          <div className="demo-banner">
            Demo Mode — Choose a portal view
          </div>

          {/* Coach */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 8 }}>
              Coach / Admin
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 12, lineHeight: 1.6 }}>
              Diagnostic engine, student modeling, feedback builder, and session flow.
            </div>
            <button className="btn btn-gold" onClick={() => handleLogin(coachProfile.id)} style={{ width: '100%', justifyContent: 'center' }}>
              Open Coach Workspace
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

          {/* Students */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 8 }}>
              Student Portal
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 12, lineHeight: 1.6 }}>
              Weekly plan, daily tasks, section frameworks, MQL log, and progress tracking.
            </div>
            <select
              className="form-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ marginBottom: 12 }}
            >
              <option value="">Choose student...</option>
              {studentProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn btn-ghost"
              disabled={!selected}
              onClick={() => handleLogin(selected)}
              style={{ width: '100%', justifyContent: 'center', opacity: selected ? 1 : 0.4 }}
            >
              Open Student Portal
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Uses seeded local data today.<br />
          Same architecture connects to Supabase later.
        </div>
      </div>
    </div>
  );
}
