import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { demoProfiles, demoStudents, demoCredentials, haniyehWeekPlan, STUDENT_COLORS } from '../../data/seedData';
import { appConfig } from '../../config/appConfig';

const PortalContext = createContext(null);

const STORAGE_KEY = 'acedat_portal_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function PortalProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = loadState();
    return saved.session || null;
  });

  const [taskCompletion, setTaskCompletion] = useState(() => {
    const saved = loadState();
    return saved.taskCompletion || {};
  });

  const [notes, setNotes] = useState(() => {
    const saved = loadState();
    return saved.notes || {};
  });

  const [mqlErrors, setMqlErrors] = useState(() => {
    const saved = loadState();
    return saved.mqlErrors || [];
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
  const students = useMemo(() => [...demoStudents, ...extraStudents], [extraStudents]);
  const credentials = useMemo(() => [...demoCredentials, ...extraCredentials], [extraCredentials]);

  const currentProfile = useMemo(
    () => profiles.find(p => p.id === session?.profileId) || null,
    [profiles, session]
  );

  const currentStudent = useMemo(
    () => (currentProfile?.studentId ? students.find(s => s.id === currentProfile.studentId) : null),
    [currentProfile, students]
  );

  const weeklyPlan = useMemo(() => {
    if (!currentStudent) return null;
    if (currentStudent.id === 'haniyeh') return haniyehWeekPlan;
    return null;
  }, [currentStudent]);

  const persist = useCallback((updates) => {
    const current = loadState();
    const next = { ...current, ...updates };
    saveState(next);
  }, []);

  // ── Auth: credential-based login ──
  const loginWithCredentials = useCallback((email, password) => {
    const cred = credentials.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
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
  }, [credentials, profiles, persist]);

  // Legacy: direct profile login (still used internally)
  const loginAsProfile = useCallback((profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    const nextSession = { profileId: profile.id, role: profile.role, name: profile.name, studentId: profile.studentId || null };
    setSession(nextSession);
    persist({ session: nextSession });
  }, [profiles, persist]);

  const logout = useCallback(() => {
    setSession(null);
    persist({ session: null });
  }, [persist]);

  // ── Add Student ──
  const addStudent = useCallback((studentData) => {
    const id = studentData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const profileId = `student-${id}`;
    const colorIdx = (demoStudents.length + extraStudents.length) % STUDENT_COLORS.length;

    const newStudent = {
      id,
      name: studentData.name,
      initials: studentData.name.charAt(0).toUpperCase(),
      color: STUDENT_COLORS[colorIdx],
      status: 'Active',
      program: studentData.program || 'Accelerator',
      phase: 'Week 1',
      targetScore: studentData.targetScore || 20,
      testDate: studentData.testDate || '',
      sections: { Bio: 0, GChem: 0, OChem: 0, PAT: 0, QR: 0, RC: 0 },
      predicted: 0,
      ceiling: 0,
      weakAreas: [],
      coachNote: '',
      focusTags: [],
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
  }, [extraStudents, persist]);

  const toggleTask = useCallback((taskId) => {
    setTaskCompletion(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      persist({ taskCompletion: next });
      return next;
    });
  }, [persist]);

  const saveNote = useCallback((dayId, text) => {
    setNotes(prev => {
      const next = { ...prev, [dayId]: text };
      persist({ notes: next });
      return next;
    });
  }, [persist]);

  const addMqlError = useCallback((error) => {
    setMqlErrors(prev => {
      const next = [...prev, { ...error, id: `mql-${Date.now()}`, date: new Date().toISOString().split('T')[0] }];
      persist({ mqlErrors: next });
      return next;
    });
  }, [persist]);

  const value = useMemo(() => ({
    mode: appConfig.dataSource,
    isDemoMode: appConfig.isDemoMode,
    session,
    profiles,
    students,
    credentials,
    currentProfile,
    currentStudent,
    weeklyPlan,
    taskCompletion,
    notes,
    mqlErrors,
    loginWithCredentials,
    loginAsProfile,
    logout,
    addStudent,
    toggleTask,
    saveNote,
    addMqlError,
  }), [session, profiles, students, credentials, currentProfile, currentStudent, weeklyPlan, taskCompletion, notes, mqlErrors, loginWithCredentials, loginAsProfile, logout, addStudent, toggleTask, saveNote, addMqlError]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
