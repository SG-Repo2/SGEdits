import { createContext, useContext, useMemo, useState } from 'react';
import { createPortalApi } from '../../lib/api/createPortalApi';
import { getStudentMap } from '../../utils/selectors';
import { normalizeAssessment } from '../../features/assessments/utils';

const PortalContext = createContext(null);

export function PortalProvider({ children }) {
  const api = useMemo(() => createPortalApi(), []);
  const profiles = useMemo(() => api.getProfiles(), [api]);
  const students = useMemo(() => api.getStudents(), [api]);
  const sessions = useMemo(() => api.getSessions(), [api]);
  const payments = useMemo(() => api.getPayments(), [api]);

  const [session, setSession] = useState(() => api.getSession());
  const [weeklyPlans, setWeeklyPlans] = useState(() => api.getWeeklyPlans());
  const [selfAssessments, setSelfAssessments] = useState(() => api.getSelfAssessments());

  const studentMap = useMemo(() => getStudentMap(students), [students]);
  const currentProfile = useMemo(
    () => profiles.find((profile) => profile.id === session?.profileId) || null,
    [profiles, session],
  );
  const currentStudent = currentProfile?.studentId ? studentMap[currentProfile.studentId] : null;
  const currentAssessment = useMemo(
    () => (currentStudent ? normalizeAssessment(currentStudent, selfAssessments[currentStudent.id]) : null),
    [currentStudent, selfAssessments],
  );

  const loginAsProfile = (profileId) => {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return;
    const nextSession = {
      profileId: profile.id,
      role: profile.role,
      studentId: profile.studentId || null,
    };
    api.saveSession(nextSession);
    setSession(nextSession);
  };

  const logout = () => {
    api.clearSession();
    setSession(null);
  };

  const persistPlans = (updater) => {
    setWeeklyPlans((previousPlans) => {
      const nextPlans = typeof updater === 'function' ? updater(previousPlans) : updater;
      api.saveWeeklyPlans(nextPlans);
      return nextPlans;
    });
  };

  const saveWeeklyPlan = (plan) => {
    persistPlans((previousPlans) => ({
      ...previousPlans,
      [plan.id]: plan,
    }));
  };

  const updateWeeklyPlan = (planId, updater) => {
    persistPlans((previousPlans) => {
      const currentPlan = previousPlans[planId];
      if (!currentPlan) return previousPlans;
      return {
        ...previousPlans,
        [planId]: typeof updater === 'function' ? updater(currentPlan) : { ...currentPlan, ...updater },
      };
    });
  };

  const resetDemoPlans = () => {
    const nextPlans = api.resetWeeklyPlans();
    setWeeklyPlans(nextPlans);
  };

  const persistAssessments = (updater) => {
    setSelfAssessments((previousAssessments) => {
      const nextAssessments = typeof updater === 'function' ? updater(previousAssessments) : updater;
      api.saveSelfAssessments(nextAssessments);
      return nextAssessments;
    });
  };

  const saveSelfAssessment = (studentId, assessment) => {
    const student = studentMap[studentId];
    if (!student) return;

    persistAssessments((previousAssessments) => ({
      ...previousAssessments,
      [studentId]: {
        ...normalizeAssessment(student, previousAssessments[studentId]),
        ...normalizeAssessment(student, assessment),
        studentId,
        updatedAt: new Date().toISOString(),
        status: 'draft',
        coachUnread: false,
      },
    }));
  };

  const submitSelfAssessment = (studentId, assessment) => {
    const student = studentMap[studentId];
    if (!student) return;
    const submittedAt = new Date().toISOString();

    persistAssessments((previousAssessments) => ({
      ...previousAssessments,
      [studentId]: {
        ...normalizeAssessment(student, previousAssessments[studentId]),
        ...normalizeAssessment(student, assessment),
        studentId,
        updatedAt: submittedAt,
        submittedAt,
        reviewedAt: null,
        status: 'submitted',
        coachUnread: true,
      },
    }));
  };

  const markAssessmentReviewed = (studentId) => {
    const student = studentMap[studentId];
    if (!student) return;
    const reviewedAt = new Date().toISOString();

    persistAssessments((previousAssessments) => {
      const currentAssessment = previousAssessments[studentId];
      if (!currentAssessment) return previousAssessments;

      return {
        ...previousAssessments,
        [studentId]: {
          ...normalizeAssessment(student, currentAssessment),
          reviewedAt,
          status: 'reviewed',
          coachUnread: false,
        },
      };
    });
  };

  const resetDemoAssessments = () => {
    const nextAssessments = api.resetSelfAssessments();
    setSelfAssessments(nextAssessments);
  };

  const value = useMemo(
    () => ({
      mode: api.mode,
      profiles,
      students,
      sessions,
      payments,
      weeklyPlans,
      selfAssessments,
      session,
      currentProfile,
      currentStudent,
      currentAssessment,
      loginAsProfile,
      logout,
      saveWeeklyPlan,
      updateWeeklyPlan,
      resetDemoPlans,
      saveSelfAssessment,
      submitSelfAssessment,
      markAssessmentReviewed,
      resetDemoAssessments,
    }),
    [api.mode, currentAssessment, currentProfile, currentStudent, payments, profiles, selfAssessments, session, sessions, students, weeklyPlans],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used inside PortalProvider');
  }
  return context;
}
