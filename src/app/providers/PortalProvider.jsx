import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { demoProfiles, demoStudents, haniyehWeekPlan } from '../../data/seedData';
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

  const profiles = demoProfiles;
  const students = demoStudents;

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

  const loginAsProfile = useCallback((profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    const nextSession = { profileId: profile.id, role: profile.role, studentId: profile.studentId || null, name: profile.name };
    setSession(nextSession);
    persist({ session: nextSession });
  }, [profiles, persist]);

  const logout = useCallback(() => {
    setSession(null);
    persist({ session: null });
  }, [persist]);

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
      const next = [...prev, { ...error, id: \`mql-\${Date.now()}\`, date: new Date().toISOString().split('T')[0] }];
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
    currentProfile,
    currentStudent,
    weeklyPlan,
    taskCompletion,
    notes,
    mqlErrors,
    loginAsProfile,
    logout,
    toggleTask,
    saveNote,
    addMqlError,
  }), [session, currentProfile, currentStudent, weeklyPlan, taskCompletion, notes, mqlErrors, loginAsProfile, logout, toggleTask, saveNote, addMqlError]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
