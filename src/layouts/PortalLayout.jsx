import { useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { usePortal } from '../app/providers/PortalProvider';
import { CoachNotifications } from '../components/layout/CoachNotifications';
import { coachNavigation, studentNavigation } from '../config/navigation';
import { PortalHeader } from '../components/layout/PortalHeader';
import { PortalSidebar } from '../components/layout/PortalSidebar';
import { getCoachNotifications } from '../utils/selectors';

export function PortalLayout() {
  const { currentProfile, profiles, students, selfAssessments, loginAsProfile, logout, markAssessmentReviewed } = usePortal();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigation = useMemo(
    () => (currentProfile?.role === 'coach' ? coachNavigation : studentNavigation),
    [currentProfile?.role],
  );
  const coachNotifications = useMemo(
    () => (currentProfile?.role === 'coach' ? getCoachNotifications(students, selfAssessments) : []),
    [currentProfile?.role, selfAssessments, students],
  );

  const handleProfileChange = (profileId) => {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return;
    loginAsProfile(profile.id);
    navigate(profile.homePath);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkReviewed = (studentId) => {
    markAssessmentReviewed(studentId);
  };

  return (
    <div className="portal-shell">
      <PortalSidebar navigation={navigation} onClose={() => setSidebarOpen(false)} open={sidebarOpen} profile={currentProfile} />
      <div className="portal-shell__main">
        <PortalHeader
          coachNotifications={
            currentProfile?.role === 'coach' ? (
              <CoachNotifications
                notifications={coachNotifications}
                onMarkReviewed={handleMarkReviewed}
                onToggle={() => setNotificationsOpen((value) => !value)}
                open={notificationsOpen}
              />
            ) : null
          }
          currentProfile={currentProfile}
          onLogout={handleLogout}
          onProfileChange={handleProfileChange}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          profiles={profiles}
        />
        <main className="portal-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
