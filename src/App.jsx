import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { appConfig } from './config/appConfig';
import { PortalProvider, usePortal } from './app/providers/PortalProvider';
import { SupabaseProvider } from './app/providers/SupabaseProvider';
import { PortalLayout } from './layouts/PortalLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentWeeklyPlan } from './pages/student/StudentWeeklyPlan';
import { StudentSections } from './pages/student/StudentSections';
import { StudentMQL } from './pages/student/StudentMQL';
import { StudentProgress } from './pages/student/StudentProgress';
import { StudentCheckIn } from './pages/student/StudentCheckIn';
import { StudentMissedQuestions } from './pages/student/StudentMissedQuestions';
import { CoachDashboard } from './pages/coach/CoachDashboard';
import { CoachStudents } from './pages/coach/CoachStudents';
import { CoachDiagnostic } from './pages/coach/CoachDiagnostic';
import { CoachSessionFlow } from './pages/coach/CoachSessionFlow';
import { CoachScheduleBuilder } from './pages/coach/CoachScheduleBuilder';
import { CoachPlanningHub } from './pages/coach/CoachPlanningHub';

const DataProvider = appConfig.isDemoMode ? PortalProvider : SupabaseProvider;

const LoadingScreen = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#0a1f0f'
  }}>
    <div style={{ textAlign: 'center', color: '#c9a84c' }}>
      <div style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>Loading...</div>
    </div>
  </div>
);

function RequireAuth({ children }) {
  const { session, loading } = usePortal();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate replace to="/login" />;
  return children;
}

function RequireRole({ role, children }) {
  const { session, loading } = usePortal();
  if (loading) return null;
  if (!session) return <Navigate replace to="/login" />;
  if (session.role !== role) return <Navigate replace to="/" />;
  return children;
}

function RoleRedirect() {
  const { session, loading } = usePortal();
  if (loading) return null;
  if (!session) return <Navigate replace to="/login" />;
  if (session.role === 'coach') return <Navigate replace to="/coach/dashboard" />;
  return <Navigate replace to="/student/dashboard" />;
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><PortalLayout /></RequireAuth>}>
            <Route index element={<RoleRedirect />} />
            <Route path="student/dashboard" element={<RequireRole role="student"><StudentDashboard /></RequireRole>} />
            <Route path="student/weekly-plan" element={<RequireRole role="student"><StudentWeeklyPlan /></RequireRole>} />
            <Route path="student/sections" element={<RequireRole role="student"><StudentSections /></RequireRole>} />
            <Route path="student/mql" element={<RequireRole role="student"><StudentMQL /></RequireRole>} />
            <Route path="student/check-in" element={<RequireRole role="student"><StudentCheckIn /></RequireRole>} />
            <Route path="student/missed-questions" element={<RequireRole role="student"><StudentMissedQuestions /></RequireRole>} />
            <Route path="student/progress" element={<RequireRole role="student"><StudentProgress /></RequireRole>} />
            <Route path="coach/dashboard" element={<RequireRole role="coach"><CoachDashboard /></RequireRole>} />
            <Route path="coach/students" element={<RequireRole role="coach"><CoachStudents /></RequireRole>} />
            <Route path="coach/diagnostic" element={<RequireRole role="coach"><CoachDiagnostic /></RequireRole>} />
            <Route path="coach/schedule-builder" element={<RequireRole role="coach"><CoachScheduleBuilder /></RequireRole>} />
            <Route path="coach/session-flow" element={<RequireRole role="coach"><CoachSessionFlow /></RequireRole>} />
            <Route path="coach/planning-hub" element={<RequireRole role="coach"><CoachPlanningHub /></RequireRole>} />
          </Route>
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
