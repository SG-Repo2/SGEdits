import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AuthLayout } from '../../layouts/AuthLayout';

export function LoginPage() {
  const { currentProfile, profiles, loginAsProfile } = usePortal();
  const navigate = useNavigate();
  const coachProfile = profiles.find((profile) => profile.role === 'coach');
  const studentProfiles = profiles.filter((profile) => profile.role === 'student');
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState(studentProfiles[0]?.id || '');

  useEffect(() => {
    if (currentProfile) {
      navigate(currentProfile.homePath, { replace: true });
    }
  }, [currentProfile, navigate]);

  const handleCoachLogin = () => {
    if (!coachProfile) return;
    loginAsProfile(coachProfile.id);
    navigate(coachProfile.homePath);
  };

  const handleStudentLogin = () => {
    const profile = studentProfiles.find((item) => item.id === selectedStudentProfileId);
    if (!profile) return;
    loginAsProfile(profile.id);
    navigate(profile.homePath);
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card__header">
          <Badge tone="success">Demo mode</Badge>
          <h2>Choose a portal view</h2>
          <p>The login uses seeded local data today and the same repository contract can point to Supabase later.</p>
        </div>

        <div className="auth-card__section">
          <div className="auth-choice">
            <div>
              <h3>Coach / admin</h3>
              <p>Operations dashboard, students roster, billing visibility, and weekly plan editing.</p>
            </div>
            <Button onClick={handleCoachLogin}>Open coach workspace</Button>
          </div>
        </div>

        <div className="auth-card__section">
          <div className="auth-choice auth-choice--stack">
            <div>
              <h3>Student portal</h3>
              <p>Switch into any seeded student profile to review weekly plans, sessions, and payment status.</p>
            </div>
            <label className="select-shell">
              <span>Student demo profile</span>
              <select onChange={(event) => setSelectedStudentProfileId(event.target.value)} value={selectedStudentProfileId}>
                {studentProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={handleStudentLogin} tone="accent">
              Open student portal
            </Button>
          </div>
        </div>

        <div className="auth-card__footer">
          <p>What is real right now: routing, state, seeded local repositories, editable weekly plans, role-based views, and Netlify-ready SPA routing.</p>
          <p>What is placeholder: Supabase auth, database persistence, and live tutor/student permissions.</p>
        </div>
      </div>
    </AuthLayout>
  );
}
