/**
 * SupabaseProvider — Live data provider for AceDAT Portal
 *
 * Exposes the SAME context API as PortalProvider so all
 * pages work identically in demo or live mode.
 *
 * CRITICAL: onAuthStateChange fires inside the Supabase Web Lock.
 * Calling supabase.* inside that callback → same-lock re-entrance → deadlock.
 * All supabase work is deferred via setTimeout(fn, 0).
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { supabase } from '../../lib/supabase/client';
import { appConfig } from '../../config/appConfig';

const PortalContext = createContext(null);

// ── Row → JS object converters ──────────────────────────────────

function rowToStudent(row) {
  if (!row) return null;
  return {
    id:          row.id,
    name:        row.name || '',
    email:       row.email || '',
    initials:    row.initials || (row.name ? row.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'),
    color:       row.color || '#C9A84C',
    phone:       row.phone || '',
    targetAA:    row.target_aa ?? 22,
    predicted:   row.predicted ?? null,
    sections:    row.sections || { Bio: 0, GC: 0, OC: 0, RC: 0, QR: 0, PAT: 0, TS: 0 },
    program:     row.program || 'Full DAT',
    phase:       row.phase || 'Foundation',
    testDate:    row.test_date || null,
    coachNote:   row.coach_note || '',
    weakAreas:   row.weak_areas || [],
    focusTags:   row.focus_tags || [],
    ceiling:     row.ceiling ?? null,
    coachId:     row.coach_id || null,
  };
}

function rowToProfile(row) {
  if (!row) return null;
  return {
    id:        row.id,
    role:      row.role || 'student',
    name:      row.name || '',
    studentId: row.student_id || null,
    homePath:  row.home_path || (row.role === 'coach' ? '/coach/dashboard' : '/student/dashboard'),
    label:     row.label || `${row.name || ''} Portal`,
  };
}

function rowToCheckIn(row) {
  if (!row) return null;
  return {
    id:          row.id,
    studentId:   row.student_id,
    weekId:      row.week_id || '',
    submittedAt: row.submitted_at || row.created_at,
    ...(row.data || {}),
  };
}

function rowToWeeklyPlan(row) {
  if (!row) return null;
  const planData = row.plan_data || {};
  return {
    id:          row.id,
    studentId:   row.student_id,
    weekStart:   row.week_start || planData.weekStart || null,
    status:      row.status || 'draft',
    publishedAt: row.published_at || null,
    ...planData,
  };
}

function rowToMqlError(row) {
  if (!row) return null;
  return {
    id:                row.id,
    studentId:         row.student_id,
    date:              row.date || row.created_at?.split('T')[0] || '',
    section:           row.section || '',
    subtopic:          row.subtopic || '',
    source:            row.source || '',
    examNumber:        row.exam_number || '',
    questionNumber:    row.question_number || '',
    errorType:         row.error_type || '',
    confidenceBefore:  row.confidence_before ?? 0,
    whyMissed:         row.why_missed || '',
    takeaway:          row.takeaway || '',
    reviewed:          row.reviewed || false,
    stillWeak:         row.still_weak || false,
    includeInNextPlan: row.include_in_next_plan || false,
    category:          row.category || '',
  };
}

// ── Provider ────────────────────────────────────────────

export function SupabaseProvider({ children }) {
  const mounted = useRef(true);

  const [session, setSession]               = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [students, setStudents]             = useState([]);
  const [mqlErrors, setMqlErrors]           = useState([]);
  const [checkIns, setCheckIns]             = useState({});
  const [weeklyPlans, setWeeklyPlans]       = useState({});
  const [taskCompletion, setTaskCompletion] = useState({});
  const [notes, setNotes]                   = useState({});
  const [insights, setInsights]             = useState([]);
  const [loading, setLoading]               = useState(true);

  const resolveSession = useCallback(async (user) => {
    if (!user || !mounted.current) return;

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!mounted.current) return;

    if (!profileRow) {
      console.warn('[SupabaseProvider] No profile found for user', user.id);
      setCurrentProfile(null);
      setCurrentStudent(null);
      return;
    }

    const profile = rowToProfile(profileRow);
    setCurrentProfile(profile);

    setSession({
      profileId: profile.id,
      role:      profile.role,
      name:      profile.name,
      studentId: profile.studentId || null,
    });

    if (profile.studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('*')
        .eq('id', profile.studentId)
        .single();

      if (mounted.current && studentRow) {
        setCurrentStudent(rowToStudent(studentRow));
      }
    } else {
      if (mounted.current) setCurrentStudent(null);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    if (!mounted.current) return;

    const [
      { data: studentsData },
      { data: mqlData },
      { data: checkInData },
      { data: plansData },
      { data: taskData },
      { data: notesData },
      { data: insightsData },
    ] = await Promise.all([
      supabase.from('students').select('*').order('name'),
      supabase.from('mql_errors').select('*').order('created_at', { ascending: false }),
      supabase.from('check_ins').select('*').order('submitted_at', { ascending: false }),
      supabase.from('weekly_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('task_completions').select('*'),
      supabase.from('student_notes').select('*'),
      supabase.from('insights').select('*').order('created_at', { ascending: false }),
    ]);

    if (!mounted.current) return;

    if (studentsData) setStudents(studentsData.map(rowToStudent));
    if (mqlData) setMqlErrors(mqlData.map(rowToMqlError));

    if (checkInData) {
      const map = {};
      checkInData.forEach(row => {
        const ci = rowToCheckIn(row);
        if (ci) map[`${ci.studentId}:${ci.weekId || row.id}`] = ci;
      });
      setCheckIns(map);
    }

    if (plansData) {
      const map = {};
      plansData.forEach(row => {
        const plan = rowToWeeklyPlan(row);
        if (!plan) return;
        const sid = plan.studentId;
        if (!map[sid] || map[sid].status !== 'published') map[sid] = plan;
      });
      setWeeklyPlans(map);
    }

    if (taskData) {
      const map = {};
      taskData.forEach(row => {
        if (row.student_id && row.task_id) map[`${row.student_id}:${row.task_id}`] = !!row.completed;
      });
      setTaskCompletion(map);
    }

    if (notesData) {
      const map = {};
      notesData.forEach(row => {
        if (row.student_id && (row.day_id || row.id)) {
          map[`${row.student_id}:${row.day_id || row.id}`] = row.note_text || row.content || '';
        }
      });
      setNotes(map);
    }

    if (insightsData) setInsights(insightsData);
    if (mounted.current) setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user && mounted.current) {
        resolveSession(existingSession.user).then(() => {
          if (mounted.current) loadAllData();
        });
      } else if (mounted.current) {
        setLoading(false);
      }
    });

    // CRITICAL: onAuthStateChange fires inside the Supabase Web Lock.
    // Do NOT call supabase.* inside this callback directly.
    // Defer ALL supabase work via setTimeout(fn, 0) to escape the lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' && s?.user) {
        const user = s.user;
        setTimeout(async () => {
          if (mounted.current) {
            await resolveSession(user);
            loadAllData();
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        if (mounted.current) {
          setSession(null);
          setCurrentProfile(null);
          setCurrentStudent(null);
          setStudents([]);
          setMqlErrors([]);
          setCheckIns({});
          setWeeklyPlans({});
          setTaskCompletion({});
          setNotes({});
          setInsights([]);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [resolveSession, loadAllData]);

  const weeklyPlan = useMemo(() => {
    if (!currentStudent) return null;
    return weeklyPlans[currentStudent.id] || null;
  }, [currentStudent, weeklyPlans]);

  const loginWithCredentials = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
    return { success: true, profile: data.user };
  }, []);

  const loginAsProfile = useCallback(() => {
    console.warn('[SupabaseProvider] loginAsProfile not supported in live mode');
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const addStudent = useCallback(async (studentData) => {
    const res = await fetch('/.netlify/functions/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ((await supabase.auth.getSession()).data?.session?.access_token || '') },
      body: JSON.stringify({
        name:      studentData.name,
        email:     studentData.email,
        phone:     studentData.phone || '',
        testDate:  studentData.testDate || null,
        targetAA:  studentData.targetAA || 22,
        program:   studentData.program || 'Full DAT',
        weakAreas: studentData.weakAreas || [],
        coachId:   studentData.coachId || null,
        sections:  studentData.sections || {},
      }),
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      return { success: false, error: result.error || 'Failed to create student' };
    }
    const { data: studentsData } = await supabase.from('students').select('*').order('name');
    if (mounted.current && studentsData) setStudents(studentsData.map(rowToStudent));
    return { success: true, tempPassword: result.tempPassword, authUserCreated: result.authUserCreated, student: result.student };
  }, []);

  const updateStudent = useCallback(async (studentId, updates) => {
    const dbUpdates = {};
    const fieldMap = {
      name: 'name', email: 'email', phone: 'phone',
      testDate: 'test_date', targetAA: 'target_aa', predicted: 'predicted',
      sections: 'sections', program: 'program', phase: 'phase',
      coachNote: 'coach_note', weakAreas: 'weak_areas', focusTags: 'focus_tags',
      ceiling: 'ceiling', coachId: 'coach_id', color: 'color', initials: 'initials',
    };
    Object.entries(updates).forEach(([k, v]) => { if (fieldMap[k]) dbUpdates[fieldMap[k]] = v; });
    if (Object.keys(dbUpdates).length === 0) return;

    const { data, error } = await supabase
      .from('students').update(dbUpdates).eq('id', studentId).select().single();

    if (error) { console.error('[SupabaseProvider] updateStudent error:', error); return; }

    if (mounted.current && data) {
      const updated = rowToStudent(data);
      setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
      if (currentStudent?.id === studentId) setCurrentStudent(updated);
    }
  }, [currentStudent]);

  const updateStudentSections = useCallback(async (studentId, sections) => {
    await updateStudent(studentId, { sections });
  }, [updateStudent]);

  const toggleTask = useCallback(async (taskId) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}:${taskId}`;
    const next = !taskCompletion[key];
    setTaskCompletion(prev => ({ ...prev, [key]: next }));
    await supabase.from('task_completions').upsert(
      { student_id: currentStudent.id, task_id: taskId, completed: next },
      { onConflict: 'student_id,task_id' }
    );
  }, [currentStudent, taskCompletion]);

  const saveNote = useCallback(async (dayId, text) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}:${dayId}`;
    setNotes(prev => ({ ...prev, [key]: text }));
    await supabase.from('student_notes').upsert(
      { student_id: currentStudent.id, day_id: dayId, note_text: text },
      { onConflict: 'student_id,day_id' }
    );
  }, [currentStudent]);

  const addMqlError = useCallback(async (error) => {
    if (!currentStudent) return;
    const row = {
      student_id: currentStudent.id, date: new Date().toISOString().split('T')[0],
      section: error.section || '', subtopic: error.subtopic || '',
      source: error.source || '', exam_number: error.examNumber || '',
      question_number: error.questionNumber || '', error_type: error.errorType || '',
      confidence_before: error.confidenceBefore || 0, why_missed: error.whyMissed || '',
      takeaway: error.takeaway || '', reviewed: error.reviewed || false,
      still_weak: error.stillWeak || false, include_in_next_plan: error.includeInNextPlan || false,
      category: error.category || '',
    };
    const { data } = await supabase.from('mql_errors').insert(row).select().single();
    if (data && mounted.current) setMqlErrors(prev => [rowToMqlError(data), ...prev]);
  }, [currentStudent]);

  const addMqlErrorForStudent = useCallback(async (studentId, error) => {
    const row = {
      student_id: studentId, date: new Date().toISOString().split('T')[0],
      section: error.section || '', subtopic: error.subtopic || '',
      source: error.source || '', exam_number: error.examNumber || '',
      question_number: error.questionNumber || '', error_type: error.errorType || '',
      confidence_before: error.confidenceBefore || 0, why_missed: error.whyMissed || '',
      takeaway: error.takeaway || '', reviewed: error.reviewed || false,
      still_weak: error.stillWeak || false, include_in_next_plan: error.includeInNextPlan || false,
      category: error.category || '',
    };
    const { data } = await supabase.from('mql_errors').insert(row).select().single();
    if (data && mounted.current) setMqlErrors(prev => [rowToMqlError(data), ...prev]);
  }, []);

  const updateMqlError = useCallback(async (errorId, updates) => {
    const dbUpdates = {};
    if ('reviewed' in updates)          dbUpdates.reviewed = updates.reviewed;
    if ('stillWeak' in updates)         dbUpdates.still_weak = updates.stillWeak;
    if ('includeInNextPlan' in updates) dbUpdates.include_in_next_plan = updates.includeInNextPlan;
    if ('takeaway' in updates)          dbUpdates.takeaway = updates.takeaway;
    if ('category' in updates)          dbUpdates.category = updates.category;
    await supabase.from('mql_errors').update(dbUpdates).eq('id', errorId);
    if (mounted.current) setMqlErrors(prev => prev.map(e => e.id === errorId ? { ...e, ...updates } : e));
  }, []);

  const deleteMqlError = useCallback(async (errorId) => {
    await supabase.from('mql_errors').delete().eq('id', errorId);
    if (mounted.current) setMqlErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const submitCheckIn = useCallback(async (studentId, weekId, data) => {
    const row = { student_id: studentId, week_id: weekId, data, submitted_at: new Date().toISOString() };
    const { data: saved } = await supabase
      .from('check_ins').upsert(row, { onConflict: 'student_id,week_id' }).select().single();
    if (saved && mounted.current) {
      const ci = rowToCheckIn(saved);
      setCheckIns(prev => ({ ...prev, [`${ci.studentId}:${ci.weekId}`]: ci }));
    }
  }, []);

  const getCheckIns = useCallback((studentId) => {
    return Object.entries(checkIns)
      .filter(([key]) => key.startsWith(`${studentId}:`))
      .map(([, v]) => v)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [checkIns]);

  const getLatestCheckIn = useCallback((studentId) => {
    const all = Object.entries(checkIns)
      .filter(([key]) => key.startsWith(`${studentId}:`))
      .map(([, v]) => v)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return all[0] || null;
  }, [checkIns]);

  const saveWeeklyPlan = useCallback(async (studentId, plan) => {
    const { days, weekLabel, title, weekStart, status, ...rest } = plan;
    const planData = { days, weekLabel, title, weekStart, ...rest };
    const row = {
      student_id: studentId,
      week_start: weekStart || new Date().toISOString().split('T')[0],
      status: status || 'draft',
      plan_data: planData,
    };
    let saved;
    if (plan.id && !plan.id.startsWith('wp-local-')) {
      const { data, error: upErr } = await supabase.from('weekly_plans').update({ ...row, plan_data: planData }).eq('id', plan.id).select().single();
      if (upErr) throw new Error(upErr.message || 'Plan save failed');
      saved = data;
    } else {
      const { data, error: insErr } = await supabase.from('weekly_plans').insert(row).select().single();
      if (insErr) throw new Error(insErr.message || 'Plan save failed');
      saved = data;
    }
    if (saved && mounted.current) setWeeklyPlans(prev => ({ ...prev, [studentId]: rowToWeeklyPlan(saved) }));
  }, []);

  const getWeeklyPlan = useCallback((studentId) => weeklyPlans[studentId] || null, [weeklyPlans]);

  const publishWeeklyPlan = useCallback(async (studentId, planId) => {
    const plan = weeklyPlans[studentId];
    if (!plan) return;
    const id = planId || plan.id;
    await supabase.from('weekly_plans').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
    if (mounted.current) {
      setWeeklyPlans(prev => ({ ...prev, [studentId]: { ...prev[studentId], status: 'published', publishedAt: new Date().toISOString() } }));
    }
  }, [weeklyPlans]);

  const addInsight = useCallback(async (insight) => {
    const { data } = await supabase.from('insights').insert({ ...insight, created_at: new Date().toISOString() }).select().single();
    if (data && mounted.current) setInsights(prev => [data, ...prev]);
  }, []);

  const updateInsight = useCallback(async (insightId, updates) => {
    await supabase.from('insights').update(updates).eq('id', insightId);
    if (mounted.current) setInsights(prev => prev.map(i => i.id === insightId ? { ...i, ...updates } : i));
  }, []);

  const value = useMemo(() => ({
    mode: appConfig.dataSource, isDemoMode: false,
    session, loading, currentProfile, currentStudent,
    weeklyPlan, weeklyPlans, students, mqlErrors, checkIns,
    taskCompletion, notes, insights,
    loginWithCredentials, loginAsProfile, logout,
    addStudent, updateStudent, updateStudentSections,
    toggleTask, saveNote,
    addMqlError, addMqlErrorForStudent, updateMqlError, deleteMqlError,
    submitCheckIn, getCheckIns, getLatestCheckIn,
    saveWeeklyPlan, getWeeklyPlan, publishWeeklyPlan,
    addInsight, updateInsight,
  }), [
    session, loading, currentProfile, currentStudent,
    weeklyPlan, weeklyPlans, students, mqlErrors, checkIns,
    taskCompletion, notes, insights,
    loginWithCredentials, loginAsProfile, logout,
    addStudent, updateStudent, updateStudentSections,
    toggleTask, saveNote,
    addMqlError, addMqlErrorForStudent, updateMqlError, deleteMqlError,
    submitCheckIn, getCheckIns, getLatestCheckIn,
    saveWeeklyPlan, getWeeklyPlan, publishWeeklyPlan,
    addInsight, updateInsight,
  ]);

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside SupabaseProvider');
  return ctx;
}
