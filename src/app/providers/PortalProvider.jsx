import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  demoProfiles,
  demoStudents,
  demoCredentials,
  haniyehWeekPlan,
  STUDENT_TEMPLATE,
  STUDENT_COLORS,
} from '../../data/seedData';
import { appConfig } from '../../config/appConfig';

export export const PortalContext = createContext(null);

const STORAGE_KEY = 'acedat_portal_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function PortalProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = loadState();
    return saved.session || null;
  });

  // ââ Student-Scoped Data ââ
  // Task completion: keyed as {studentId}:{taskId}
  const [taskCompletion, setTaskCompletion] = useState(() => {
    const saved = loadState();
    return saved.taskCompletion || {};
  });

  // Notes: keyed as {studentId}:{dayId}
  const [notes, setNotes] = useState(() => {
    const saved = loadState();
    return saved.notes || {};
  });

  // MQL Errors: array where each error includes studentId and rich error fields
  const [mqlErrors, setMqlErrors] = useState(() => {
    const saved = loadState();
    return saved.mqlErrors || [];
  });

  // Check-ins: keyed as {studentId}:{weekId}
  const [checkIns, setCheckIns] = useState(() => {
    const saved = loadState();
    return saved.checkIns || {};
  });

  // ââ Weekly Plans Storage ââ
  // Keyed by studentId, with status: 'draft' | 'published'
  const [weeklyPlans, setWeeklyPlans] = useState(() => {
    const saved = loadState();
    const plans = saved.weeklyPlans || {};
    // Seed Haniyeh's plan if not already present
    if (!plans['haniyeh']) {
      plans['haniyeh'] = {
        ...haniyehWeekPlan,
        status: 'published',
      };
    }
    return plans;
  });

  // ââ Student Overrides ââ
  // Merges on top of demo/extra students to persist edits
  const [studentOverrides, setStudentOverrides] = useState(() => {
    const saved = loadState();
    return saved.studentOverrides || {};
  });

  // ââ Insights Persistence ââ
  const [insights, setInsights] = useState(() => {
    const saved = loadState();
    return saved.insights || [];
  });

  // Dynamic students + credentials (seeded defaults + user-added)
  const [extraStudents, setExtraStudents] = useState(() => {
    const saved = loadState();
    return saved.extraStudents || [];
  });

  const [extraCredentials, setExtraCredentials] = useState(() => {
    const saved = loadState();
    return saved.extraCredentials || [];
  });

  const [extraProfiles, setExtraProfiles] = useState(() => {
    const saved = loadState();
    return saved.extraProfiles || [];
  });

  // Merge seed + dynamic data
  const profiles = useMemo(() => [...demoProfiles, ...extraProfiles], [extraProfiles]);
  const credentials = useMemo(() => [...demoCredentials, ...extraCredentials], [extraCredentials]);

  // Students merged with overrides applied
  const students = useMemo(() => {
    const allStudents = [...demoStudents, ...extraStudents];
    return allStudents.map(student => ({
      ...student,
      ...(studentOverrides[student.id] || {}),
    }));
  }, [extraStudents, studentOverrides]);

  const currentProfile = useMemo(
    () => profiles.find(p => p.id === session?.profileId) || null,
    [profiles, session]
  );

  const currentStudent = useMemo(
    () => (currentProfile?.studentId ? students.find(s => s.id === currentProfile.studentId) : null),
    [currentProfile, students]
  );

  // Compute current student's weekly plan
  const weeklyPlan = useMemo(() => {
    if (!currentStudent) return null;
    return weeklyPlans[currentStudent.id] || null;
  }, [currentStudent, weeklyPlans]);

  // Coach identity: from session name if coach, from student's coach field if student
  const coachName = useMemo(() => {
    if (session?.role === 'coach') {
      return session.name || null;
    }
    return null;
  }, [session]);

  const persist = useCallback((updates) => {
    const current = loadState();
    const next = { ...current, ...updates };
    saveState(next);
  }, []);

  // ââ Auth: credential-based login ââ
  const loginWithCredentials = useCallback(
    (email, password) => {
      const cred = credentials.find(
        c => c.email.toLowerCase() === email.toLowerCase() && c.password === password
      );
      if (!cred) return { success: false, error: 'Invalid email or password' };

      const profile = profiles.find(p => p.id === cred.profileId);
      if (!profile) return { success: false, error: 'Profile not found' };

      const nextSession = {
        profileId: profile.id,
        role: profile.role,
        name: profile.name,
        studentId: profile.studentId || null,
      };
      setSession(nextSession);
      persist({ session: nextSession });
      return { success: true, profile };
    },
    [credentials, profiles, persist]
  );

  // Legacy: direct profile login (still used internally)
  const loginAsProfile = useCallback(
    (profileId) => {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;
      const nextSession = {
        profileId: profile.id,
        role: profile.role,
        name: profile.name,
        studentId: profile.studentId || null,
      };
      setSession(nextSession);
      persist({ session: nextSession });
    },
    [profiles, persist]
  );

  const logout = useCallback(() => {
    setSession(null);
    persist({ session: null });
  }, [persist]);

  // ââ Add Student ââ
  const addStudent = useCallback(
    (studentData) => {
      const id = studentData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const profileId = `student-${id}`;
      const colorIdx = (demoStudents.length + extraStudents.length) % STUDENT_COLORS.length;

      // Use STUDENT_TEMPLATE as base and merge with provided data
      const newStudent = {
        ...STUDENT_TEMPLATE,
        id,
        name: studentData.name,
        email: studentData.email || '',
        initials: studentData.name.charAt(0).toUpperCase() + (studentData.name.split(' ')[1]?.charAt(0).toUpperCase() || ''),
        color: STUDENT_COLORS[colorIdx],
        ...studentData,
      };

      const newProfile = {
        id: profileId,
        role: 'student',
        name: studentData.name,
        studentId: id,
        label: `${studentData.name} Portal`,
        homePath: '/student/dashboard',
      };

      const newCred = {
        email: studentData.email,
        password: studentData.password || `AceDAT-${studentData.name}`,
        profileId,
      };

      setExtraStudents(prev => {
        const next = [...prev, newStudent];
        persist({ extraStudents: next });
        return next;
      });
      setExtraProfiles(prev => {
        const next = [...prev, newProfile];
        persist({ extraProfiles: next });
        return next;
      });
      setExtraCredentials(prev => {
        const next = [...prev, newCred];
        persist({ extraCredentials: next });
        return next;
      });

      return { student: newStudent, credentials: newCred };
    },
    [extraStudents, persist]
  );

  // ââ Task Completion (Student-Scoped) ââ
  const toggleTask = useCallback(
    (taskId) => {
      if (!currentStudent) return;
      const key = `${currentStudent.id}:${taskId}`;
      setTaskCompletion(prev => {
        const next = { ...prev, [key]: !prev[key] };
        persist({ taskCompletion: next });
        return next;
      });
    },
    [currentStudent, persist]
  );

  // ââ Notes (Student-Scoped) ââ
  const saveNote = useCallback(
    (dayId, text) => {
      if (!currentStudent) return;
      const key = `${currentStudent.id}:${dayId}`;
      setNotes(prev => {
        const next = { ...prev, [key]: text };
        persist({ notes: next });
        return next;
      });
    },
    [currentStudent, persist]
  );

  // ââ MQL Errors (Student-Scoped) ââ
  const addMqlError = useCallback(
    (error) => {
      if (!currentStudent) return;
      setMqlErrors(prev => {
        const next = [
          ...prev,
          {
            ...error,
            studentId: currentStudent.id,
            id: `mql-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            // Rich error fields with defaults
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
          },
        ];
        persist({ mqlErrors: next });
        return next;
      });
    },
    [currentStudent, persist]
  );

  // ââ MQL Errors for Any Student (Coach-Scoped) ââ
  const addMqlErrorForStudent = useCallback(
    (studentId, error) => {
      setMqlErrors(prev => {
        const next = [
          ...prev,
          {
            ...error,
            studentId,
            id: `mql-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            // Rich error fields with defaults
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
          },
        ];
        persist({ mqlErrors: next });
        return next;
      });
    },
    [persist]
  );

  // ââ Update MQL Error ââ
  const updateMqlError = useCallback(
    (errorId, updates) => {
      setMqlErrors(prev => {
        const next = prev.map(error =>
          error.id === errorId ? { ...error, ...updates } : error
        );
        persist({ mqlErrors: next });
        return next;
      });
    },
    [persist]
  );

  // ââ Delete MQL Error ââ
  const deleteMqlError = useCallback(
    (errorId) => {
      setMqlErrors(prev => {
        const next = prev.filter(error => error.id !== errorId);
        persist({ mqlErrors: next });
        return next;
      });
    },
    [persist]
  );

  // ââ Check-ins Management ââ
  const submitCheckIn = useCallback(
    (studentId, weekId, data) => {
      setCheckIns(prev => {
        const key = `${studentId}:${weekId}`;
        const next = {
          ...prev,
          [key]: {
            ...data,
            studentId,
            weekId,
            submittedAt: new Date().toISOString(),
          },
        };
        persist({ checkIns: next });
        return next;
      });
    },
    [persist]
  );

  const getCheckIns = useCallback(
    (studentId) => {
      const studentCheckIns = Object.entries(checkIns)
        .filter(([key]) => key.startsWith(`${studentId}:`))
        .map(([, value]) => value)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return studentCheckIns;
    },
    [checkIns]
  );

  const getLatestCheckIn = useCallback(
    (studentId) => {
      const allCheckIns = getCheckIns(studentId);
      return allCheckIns.length > 0 ? allCheckIns[0] : null;
    },
    [getCheckIns]
  );

  // ââ Weekly Plans Management ââ
  const saveWeeklyPlan = useCallback(
    (studentId, plan) => {
      setWeeklyPlans(prev => {
        const next = {
          ...prev,
          [studentId]: {
            ...plan,
            status: plan.status || 'draft',
          },
        };
        persist({ weeklyPlans: next });
        return next;
      });
    },
    [persist]
  );

  const getWeeklyPlan = useCallback(
    (studentId) => {
      return weeklyPlans[studentId] || null;
    },
    [weeklyPlans]
  );

  const publishWeeklyPlan = useCallback(
    (studentId) => {
      setWeeklyPlans(prev => {
        const plan = prev[studentId];
        if (!plan) return prev;
        const next = {
          ...prev,
          [studentId]: {
            ...plan,
            status: 'published',
            publishedAt: new Date().toISOString(),
          },
        };
        persist({ weeklyPlans: next });
        return next;
      });
    },
    [persist]
  );

  // ââ Student Editing ââ
  const updateStudent = useCallback(
    (studentId, updates) => {
      setStudentOverrides(prev => {
        const current = prev[studentId] || {};
        const next = { ...prev, [studentId]: { ...current, ...updates } };
        persist({ studentOverrides: next });
        return next;
      });
    },
    [persist]
  );

  const updateStudentSections = useCallback(
    (studentId, sections) => {
      updateStudent(studentId, { sections });
    },
    [updateStudent]
  );

  // ââ Insights Persistence ââ
  const addInsight = useCallback(
    (insight) => {
      setInsights(prev => {
        const next = [
          ...prev,
          {
            ...insight,
            id: insight.id || `insight-${Date.now()}`,
            createdAt: insight.createdAt || new Date().toISOString(),
          },
        ];
        persist({ insights: next });
        return next;
      });
    },
    [persist]
  );

  const updateInsight = useCallback(
    (insightId, updates) => {
      setInsights(prev => {
        const next = prev.map(i =>
          i.id === insightId
            ? {
                ...i,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : i
        );
        persist({ insights: next });
        return next;
      });
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      mode: appConfig.dataSource,
      isDemoMode: appConfig.isDemoMode,
      session,
      profiles,
      students,
      credentials,
      currentProfile,
      currentStudent,
      coachName,
      weeklyPlan,
      weeklyPlans,
      insights,
      taskCompletion,
      notes,
      mqlErrors,
      checkIns,
      // Auth
      loginWithCredentials,
      loginAsProfile,
      logout,
      // Students
      addStudent,
      updateStudent,
      updateStudentSections,
      // Tasks & Notes (Student-Scoped)
      toggleTask,
      saveNote,
      addMqlError,
      addMqlErrorForStudent,
      updateMqlError,
      deleteMqlError,
      // Check-ins
      submitCheckIn,
      getCheckIns,
      getLatestCheckIn,
      // Weekly Plans
      saveWeeklyPlan,
      getWeeklyPlan,
      publishWeeklyPlan,
      // Insights
      addInsight,
      updateInsight,
    }),
    [
      session,
      profiles,
      students,
      credentials,
      currentProfile,
      currentStudent,
      coachName,
      weeklyPlan,
      weeklyPlans,
      insights,
      taskCompletion,
      notes,
      mqlErrors,
      checkIns,
      loginWithCredentials,
      loginAsProfile,
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
      addInsight,
      updateInsight,
    ]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
