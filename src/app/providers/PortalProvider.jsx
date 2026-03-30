/**
 * PortalProvider.jsx
 *
 * Single context provider for the AceDAT Portal.
 * Loads seed data on mount, persists weeklyPlans and selfAssessments
 * to localStorage, and manages auth via a hardcoded credential map.
 *
 * Every data-loading function is marked with a // NOTION: comment
 * indicating where a Notion API call will replace the seed read.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { students as seedStudents } from '../../data/students';
import { sessions as seedSessions } from '../../data/sessions';
import { payments as seedPayments } from '../../data/payments';
import { weeklyPlans as seedWeeklyPlans } from '../../data/weeklyPlans';
import { selfAssessments as seedSelfAssessments } from '../../data/selfAssessments';

const PortalContext = createContext(null);

// ── LocalStorage keys ───────────────────────────────────────
const LS_SESSION = 'acethedat.session';
const LS_WEEKLY_PLANS = 'acethedat.weeklyPlans';
const LS_SELF_ASSESSMENTS = 'acethedat.selfAssessments';
const LS_STUDENTS = 'acethedat.students';
const LS_TASK_COMPLETION = 'acethedat.taskCompletion';
const LS_NOTES = 'acethedat.notes';

function readLS(key) {
  try { return JSON.parse(window.localStorage.getItem(key)); } catch { return null; }
}
function writeLS(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ── Demo credential map ─────────────────────────────────────
// NOTION: replace with Notion user lookup or lightweight auth service
const DEMO_CREDENTIALS = {
  'thomas@acethedat.com': {
    password: 'Coach2024!',
    profileId: 'coach-thomas',
    role: 'coach',
    name: 'Thomas',
    studentId: null,
    homePath: '/coach/dashboard',
  },
  // Student credentials: each student's email from the seed data
  // with password pattern AceDAT-{FirstName}
  ...Object.fromEntries(
    seedStudents.map((s) => [
      s.email,
      {
        password: `AceDAT-${s.name.split(' ')[0].replace(/[^a-zA-Z]/g, '')}`,
        profileId: `student-${s.id}`,
        role: 'student',
        name: s.name,
        studentId: s.id,
        homePath: '/student/dashboard',
      },
    ])
  ),
};

// ── Provider ────────────────────────────────────────────────
export function PortalProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionsData, setSessionsData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [mqlErrors, setMqlErrors] = useState([]);
  const [checkIns, setCheckIns] = useState({});
  const [weeklyPlans, setWeeklyPlans] = useState({});
  const [weeklyPlanHistory, setWeeklyPlanHistory] = useState({});
  const [selfAssessments, setSelfAssessments] = useState({});
  const [taskCompletion, setTaskCompletion] = useState({});
  const [notes, setNotes] = useState({});
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Load all seed / persisted data ──────────────────────────
  const loadAllData = useCallback(() => {
    // NOTION: replace this seed read with Notion API call — Students database
    const storedStudents = readLS(LS_STUDENTS);
    const loadedStudents = storedStudents && Array.isArray(storedStudents) ? storedStudents : [...seedStudents];
    setStudents(loadedStudents);

    // NOTION: replace this seed read with Notion API call — Sessions database
    setSessionsData([...seedSessions]);

    // NOTION: replace this seed read with Notion API call — Payments database
    setPaymentsData([...seedPayments]);

    // NOTION: replace this seed read with Notion API call — Weekly Plans database
    const storedPlans = readLS(LS_WEEKLY_PLANS);
    const loadedPlans = storedPlans || { ...seedWeeklyPlans };
    setWeeklyPlans(loadedPlans);

    // Build weekly plan history keyed by studentId
    const histMap = {};
    Object.values(loadedPlans).forEach((plan) => {
      const sid = plan.studentId;
      if (!sid) return;
      if (!histMap[sid]) histMap[sid] = [];
      histMap[sid].push(plan);
    });
    Object.keys(histMap).forEach((sid) =>
      histMap[sid].sort((a, b) => new Date(b.weekStart || 0) - new Date(a.weekStart || 0))
    );
    setWeeklyPlanHistory(histMap);

    // NOTION: replace this seed read with Notion API call — Self Assessments database
    const storedSA = readLS(LS_SELF_ASSESSMENTS);
    setSelfAssessments(storedSA || { ...seedSelfAssessments });

    // Task completion and notes from localStorage
    setTaskCompletion(readLS(LS_TASK_COMPLETION) || {});
    setNotes(readLS(LS_NOTES) || {});

    // MQL errors and check-ins start empty (no seed data for these)
    setMqlErrors([]);
    setCheckIns({});
    setInsights([]);
  }, []);

  // ── Restore session from localStorage on mount ──────────────
  useEffect(() => {
    const stored = readLS(LS_SESSION);
    if (stored && stored.role) {
      setSession(stored);
      setCurrentProfile({
        id: stored.profileId,
        role: stored.role,
        name: stored.name,
        studentId: stored.studentId || null,
        homePath: stored.homePath || (stored.role === 'coach' ? '/coach/dashboard' : '/student/dashboard'),
        label: stored.role === 'coach' ? 'Coach Workspace' : `${stored.name} Portal`,
      });
      loadAllData();
      // Set currentStudent if student role
      if (stored.studentId) {
        const storedStudents = readLS(LS_STUDENTS);
        const allStudents = storedStudents && Array.isArray(storedStudents) ? storedStudents : seedStudents;
        const found = allStudents.find((s) => s.id === stored.studentId);
        if (found) setCurrentStudent(found);
      }
    }
    setLoading(false);
  }, [loadAllData]);

  // ── Auth ────────────────────────────────────────────────────
  const loginWithCredentials = useCallback(async (email, password) => {
    const cred = DEMO_CREDENTIALS[email.toLowerCase()];
    if (!cred || cred.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    const sess = {
      profileId: cred.profileId,
      role: cred.role,
      name: cred.name,
      studentId: cred.studentId,
      homePath: cred.homePath,
    };
    writeLS(LS_SESSION, sess);
    setSession(sess);

    const profile = {
      id: cred.profileId,
      role: cred.role,
      name: cred.name,
      studentId: cred.studentId,
      homePath: cred.homePath,
      label: cred.role === 'coach' ? 'Coach Workspace' : `${cred.name} Portal`,
    };
    setCurrentProfile(profile);

    loadAllData();

    if (cred.studentId) {
      const found = seedStudents.find((s) => s.id === cred.studentId);
      if (found) setCurrentStudent(found);
    }

    return { success: true, profile };
  }, [loadAllData]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(LS_SESSION);
    setSession(null);
    setCurrentProfile(null);
    setCurrentStudent(null);
    setStudents([]);
    setSessionsData([]);
    setPaymentsData([]);
    setMqlErrors([]);
    setCheckIns({});
    setWeeklyPlans({});
    setWeeklyPlanHistory({});
    setSelfAssessments({});
    setTaskCompletion({});
    setNotes({});
    setInsights([]);
  }, []);

  // ── Students ────────────────────────────────────────────────
  // NOTION: replace with Notion page creation in Students database
  const addStudent = useCallback(async (studentData) => {
    const id = `S${String(students.length + 1).padStart(2, '0')}`;
    const newStudent = {
      id,
      name: studentData.name || '',
      email: studentData.email || '',
      initials: (studentData.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '??',
      color: '#C9A84C',
      phone: studentData.phone || '',
      targetAA: studentData.targetAA || 22,
      predicted: null,
      sections: studentData.sections || { Bio: 0, GC: 0, OC: 0, RC: 0, QR: 0, PAT: 0, TS: 0 },
      program: studentData.program || 'Full DAT',
      phase: studentData.phase || 'Foundation',
      testDate: studentData.testDate || null,
      coachNote: '',
      weakAreas: studentData.weakAreas || [],
      focusTags: [],
      ceiling: null,
      coachId: studentData.coachId || null,
      status: 'Active',
      primaryCoach: 'Thomas',
    };
    const next = [...students, newStudent];
    setStudents(next);
    writeLS(LS_STUDENTS, next);
    return { success: true, tempPassword: null, authUserCreated: false, student: newStudent };
  }, [students]);

  // NOTION: replace with Notion page update in Students database
  const updateStudent = useCallback((studentId, updates) => {
    setStudents((prev) => {
      const next = prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s));
      writeLS(LS_STUDENTS, next);
      return next;
    });
    if (currentStudent?.id === studentId) {
      setCurrentStudent((prev) => ({ ...prev, ...updates }));
    }
  }, [currentStudent]);

  const updateStudentSections = useCallback((studentId, sections) => {
    updateStudent(studentId, { sections });
  }, [updateStudent]);

  // ── Task Completion ─────────────────────────────────────────
  const toggleTask = useCallback((taskId) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}:${taskId}`;
    setTaskCompletion((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeLS(LS_TASK_COMPLETION, next);
      return next;
    });
  }, [currentStudent]);

  // ── Notes ───────────────────────────────────────────────────
  const saveNote = useCallback((dayId, text) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}:${dayId}`;
    setNotes((prev) => {
      const next = { ...prev, [key]: text };
      writeLS(LS_NOTES, next);
      return next;
    });
  }, [currentStudent]);

  // ── MQL Errors ──────────────────────────────────────────────
  // NOTION: replace with Notion page creation in MQL Errors database
  const addMqlError = useCallback((error) => {
    if (!currentStudent) return;
    const newError = {
      id: `mql-${Date.now()}`,
      studentId: currentStudent.id,
      date: new Date().toISOString().split('T')[0],
      section: error.section || '',
      subtopic: error.subtopic || '',
      source: error.source || '',
      examNumber: error.examNumber || '',
      questionNumber: error.questionNumber || '',
      errorType: error.errorType || '',
      confidenceBefore: error.confidenceBefore || 0,
      whyMissed: error.whyMissed || '',
      takeaway: error.takeaway || '',
      reviewed: error.reviewed || false,
      stillWeak: error.stillWeak || false,
      includeInNextPlan: error.includeInNextPlan || false,
      category: error.category || '',
    };
    setMqlErrors((prev) => [newError, ...prev]);
  }, [currentStudent]);

  // NOTION: replace with Notion page creation in MQL Errors database (coach path)
  const addMqlErrorForStudent = useCallback((studentId, error) => {
    const newError = {
      id: `mql-${Date.now()}`,
      studentId,
      date: new Date().toISOString().split('T')[0],
      section: error.section || '',
      subtopic: error.subtopic || '',
      source: error.source || '',
      examNumber: error.examNumber || '',
      questionNumber: error.questionNumber || '',
      errorType: error.errorType || '',
      confidenceBefore: error.confidenceBefore || 0,
      whyMissed: error.whyMissed || '',
      takeaway: error.takeaway || '',
      reviewed: error.reviewed || false,
      stillWeak: error.stillWeak || false,
      includeInNextPlan: error.includeInNextPlan || false,
      category: error.category || '',
    };
    setMqlErrors((prev) => [newError, ...prev]);
  }, []);

  // NOTION: replace with Notion page update in MQL Errors database
  const updateMqlError = useCallback((errorId, updates) => {
    setMqlErrors((prev) => prev.map((e) => (e.id === errorId ? { ...e, ...updates } : e)));
  }, []);

  // NOTION: replace with Notion page archive/delete in MQL Errors database
  const deleteMqlError = useCallback((errorId) => {
    setMqlErrors((prev) => prev.filter((e) => e.id !== errorId));
  }, []);

  // ── Check-Ins ───────────────────────────────────────────────
  // NOTION: replace with Notion page creation in Check-Ins database
  const submitCheckIn = useCallback((studentId, weekId, data) => {
    const ci = {
      id: `ci-${Date.now()}`,
      studentId,
      weekId,
      submittedAt: new Date().toISOString(),
      ...data,
    };
    setCheckIns((prev) => ({ ...prev, [`${studentId}:${weekId}`]: ci }));
  }, []);

  const getCheckIns = useCallback((studentId) => {
    return Object.entries(checkIns)
      .filter(([key]) => key.startsWith(`${studentId}:`))
      .map(([, v]) => v)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [checkIns]);

  const getLatestCheckIn = useCallback((studentId) => {
    const all = getCheckIns(studentId);
    return all[0] || null;
  }, [getCheckIns]);

  // ── Weekly Plans ────────────────────────────────────────────
  // NOTION: replace with Notion page creation/update in Weekly Plans database
  const saveWeeklyPlan = useCallback((studentId, plan) => {
    const planId = plan.id || `wp-local-${Date.now()}`;
    const saved = { ...plan, id: planId, studentId, savedAt: new Date().toISOString() };

    setWeeklyPlans((prev) => {
      const next = { ...prev, [studentId]: saved };
      writeLS(LS_WEEKLY_PLANS, next);
      return next;
    });

    setWeeklyPlanHistory((prev) => {
      const existing = (prev[studentId] || []).filter((p) => p.id !== planId);
      return { ...prev, [studentId]: [saved, ...existing] };
    });
  }, []);

  // NOTION: replace with Notion query for Weekly Plans database filtered by studentId
  const getWeeklyPlan = useCallback((studentId) => weeklyPlans[studentId] || null, [weeklyPlans]);

  // NOTION: replace with Notion page update in Weekly Plans database (status → published)
  const publishWeeklyPlan = useCallback((studentId, planId) => {
    setWeeklyPlans((prev) => {
      const plan = prev[studentId];
      if (!plan) return prev;
      const updated = { ...plan, status: 'published', publishedAt: new Date().toISOString() };
      const next = { ...prev, [studentId]: updated };
      writeLS(LS_WEEKLY_PLANS, next);
      return next;
    });
  }, []);

  // ── Self Assessments ────────────────────────────────────────
  // NOTION: replace with Notion page update in Self Assessments database
  const saveSelfAssessment = useCallback((studentId, assessment) => {
    setSelfAssessments((prev) => {
      const next = { ...prev, [studentId]: { ...assessment, studentId, updatedAt: new Date().toISOString() } };
      writeLS(LS_SELF_ASSESSMENTS, next);
      return next;
    });
  }, []);

  // ── Insights ────────────────────────────────────────────────
  // NOTION: replace with Notion page creation in Insights database
  const addInsight = useCallback((insight) => {
    const newInsight = { ...insight, id: `ins-${Date.now()}`, created_at: new Date().toISOString() };
    setInsights((prev) => [newInsight, ...prev]);
  }, []);

  // NOTION: replace with Notion page update in Insights database
  const updateInsight = useCallback((insightId, updates) => {
    setInsights((prev) => prev.map((i) => (i.id === insightId ? { ...i, ...updates } : i)));
  }, []);

  // ── Derived state ───────────────────────────────────────────
  const weeklyPlan = useMemo(() => {
    if (!currentStudent) return null;
    return weeklyPlans[currentStudent.id] || null;
  }, [currentStudent, weeklyPlans]);

  // ── Context value ───────────────────────────────────────────
  const value = useMemo(() => ({
    session,
    loading,
    currentProfile,
    currentStudent,
    students,
    sessions: sessionsData,
    payments: paymentsData,
    mqlErrors,
    checkIns,
    weeklyPlan,
    weeklyPlans,
    weeklyPlanHistory,
    selfAssessments,
    taskCompletion,
    notes,
    insights,
    loginWithCredentials,
    logout,
    addStudent,
    updateStudent,
    updateStudentSections,
    toggleTask,
    saveNote,
    addMqlError,
    addMqlErrorForStudent,
    updateMqlError,
    deleteMqlError,
    submitCheckIn,
    getCheckIns,
    getLatestCheckIn,
    saveWeeklyPlan,
    getWeeklyPlan,
    publishWeeklyPlan,
    saveSelfAssessment,
    addInsight,
    updateInsight,
  }), [
    session, loading, currentProfile, currentStudent,
    students, sessionsData, paymentsData,
    mqlErrors, checkIns, weeklyPlan, weeklyPlans, weeklyPlanHistory,
    selfAssessments, taskCompletion, notes, insights,
    loginWithCredentials, logout,
    addStudent, updateStudent, updateStudentSections,
    toggleTask, saveNote,
    addMqlError, addMqlErrorForStudent, updateMqlError, deleteMqlError,
    submitCheckIn, getCheckIns, getLatestCheckIn,
    saveWeeklyPlan, getWeeklyPlan, publishWeeklyPlan,
    saveSelfAssessment, addInsight, updateInsight,
  ]);

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
