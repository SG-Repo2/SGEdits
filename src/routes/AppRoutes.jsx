import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { CoachDashboardPage } from '../pages/coach/CoachDashboardPage';
import { CoachPaymentsPage } from '../pages/coach/CoachPaymentsPage';
import { CoachSchedulesPage } from '../pages/coach/CoachSchedulesPage';
import { CoachSessionsPage } from '../pages/coach/CoachSessionsPage';
import { CoachStudentDetailPage } from '../pages/coach/CoachStudentDetailPage';
import { CoachStudentsPage } from '../pages/coach/CoachStudentsPage';
import { NotFoundPage } from '../pages/shared/NotFoundPage';
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { StudentPaymentsPage } from '../pages/student/StudentPaymentsPage';
import { StudentSelfAssessmentPage } from '../pages/student/StudentSelfAssessmentPage';
import { StudentSessionsPage } from '../pages/student/StudentSessionsPage';
import { StudentWeeklyPlanPage } from '../pages/student/StudentWeeklyPlanPage';
import { PortalLayout } from '../layouts/PortalLayout';
import { RequireAuth, RequireRole, RoleHomeRedirect } from './guards';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route element={<PortalLayout />}>
            <Route element={<RoleHomeRedirect />} path="/" />

            <Route element={<RequireRole role="coach" />}>
              <Route element={<CoachDashboardPage />} path="/coach/dashboard" />
              <Route element={<CoachStudentsPage />} path="/coach/students" />
              <Route element={<CoachStudentDetailPage />} path="/coach/students/:studentId" />
              <Route element={<CoachSessionsPage />} path="/coach/sessions" />
              <Route element={<CoachPaymentsPage />} path="/coach/payments" />
              <Route element={<CoachSchedulesPage />} path="/coach/schedules" />
            </Route>

            <Route element={<RequireRole role="student" />}>
              <Route element={<StudentDashboardPage />} path="/student/dashboard" />
              <Route element={<StudentSelfAssessmentPage />} path="/student/self-assessment" />
              <Route element={<StudentWeeklyPlanPage />} path="/student/weekly-plan" />
              <Route element={<StudentPaymentsPage />} path="/student/payments" />
              <Route element={<StudentSessionsPage />} path="/student/sessions" />
            </Route>
          </Route>
        </Route>

        <Route element={<LoginPage />} path="/login" />
        <Route element={<Navigate replace to="/" />} path="/home" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}
