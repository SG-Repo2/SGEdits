import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { appConfig } from '../../config/appConfig';
import { PortalContext } from './PortalProvider';

// ── Row mappers ──────────────────────────────────────────────────────────────

function rowToStudent(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email || '',
    initials: r.initials || '',
    color: r.color || '#C9A84C',
    status: r.status || 'Active',
    program: r.program || '',
    testDate: r.test_date || '',
    targetAA: r.target_aa || 400,
    targetSections: r.target_sections || {},
    sections: r.sections || {},
    weeklyStudyHours: r.weekly_study_hours || 20,
    constraints: r.constraints || '',
    sessionCadence: r.session_cadence || 'Weekly',
    predicted: r.predicted || null,
    coach: r.coach || '',
    avatar: r.avatar || null,
  };
}

function rowToMqlError(r) {
  return {
    id: r.id,
    studentId: r.student_id,
    section: r.section || '',
    subtopic: r.subtopic || '',
    source: r.source || '',
    examNumber: r.exam_number || '',
    questionNumber: r.question_number || '',
    errorType: r.error_type || '',
    confidenceBefore: r.confidence_before || 0,
    whyMissed: r.why_missed || '',
    takeaway: r.takeaway || '',
    reviewed: r.reviewed || false,
    stillWeak: r.still_weak || false,
    includeInNextPlan: r.include_in_next_plan || false,
    date: r.date || '',
  };
}

function rowToWeeklyPlan(r) {
  return {
    id: r.id,
    studentId: r.student_id,
    weekOf: r.week_of || '',
    weekNumber: r.week_number || 1,
    notes: r.notes || '',
    blocks: r.blocks || [],
    status: r.status || 'draft',
    publishedAt: r.published_at || null,
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [mqlErrors, setMqlErrors] = useState([]);
  const [checkIns, setCheckIns] = useState({});
  const [weeklyPlans, setWeeklyPlans] = useState({});
  const [taskCompletion, setTaskCompletion] = useState({});
  const [notes, setNotes] = useState({});
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Data loader ───────────────────────────────────────────────────────────

  const loadAllData = useCallback(async () => {
    const [studRes, mqlRes, ciRes, planRes, taskRes, noteRes, insRes] = await Promise.all([
      supabase.from('students').select('*').order('name'),
      supabase.from('mql_errors').select('*').order('created_at', { ascending: false }),
      supabase.from('check_ins').select('*').order('submitted_at', { ascending: false }),
      supabase.from('weekly_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('task_completions').select('*'),
      supabase.from('student_notes').select('*'),
      supabase.from('insights').select('*').order('created_at', { ascending: false }),
    ]);

    if (studRes.data) setStudents(studRes.data.map(rowToStudent));

    if (mqlRes.data) setMqlErrors(mqlRes.data.map(rowToMqlError));

    if (ciRes.data) {
      const map = {};
      ciRes.data.forEach(r => {
        map[`${r.student_id}:${r.week_id}`] = {
          ...(r.data || {}),
          studentId: r.student_id,
          weekId: r.week_id,
          submittedAt: r.submitted_at,
        };
      });
      setCheckIns(map);
    }

    if (planRes.data) {
      const map = {};
      planRes.data.forEach(r => {
        if (!map[r.student_id]) map[r.student_id] = rowToWeeklyPlan(r);
      });
      setWeeklyPlans(map);
    }

    if (taskRes.data) {
      const map = {};
      taskRes.data.forEach(r => { map[`${r.student_id}:${r.task_id}`] = r.completed; });
      setTaskCompletion(map);
    }

    if (noteRes.data) {
      const map = {};
      noteRes.data.forEach(r => { map[`${r.student_id}:${r.day_id}`] = r.content; });
      setNotes(map);
    }

    if (insRes.data) setInsights(insRes.data);
  }, []);

  // ── Auth init ─────────────────────────────────────────────────────────────

  const resolveSession = useCallback(async (authUser) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    if (profile) {
      setSession({
        profileId: profile.id,
        role: profile.role,
        name: profile.name,
        studentId: profile.student_id || null,
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      if (s?.user) {
        await resolveSession(s.user);
        await loadAllData();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'SIGNED_IN' && s?.user) {
        await resolveSession(s.user);
        await loadAllData();
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setStudents([]);
        setMqlErrors([]);
        setCheckIns({});
        setWeeklyPlans({});
        setTaskCompletion({});
        setNotes({});
        setInsights([]);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [resolveSession, loadAllData]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const currentProfile = useMemo(() => {
    if (!session) return null;
    return { id: session.profileId, role: session.role, name: session.name, studentId: session.studentId };
  }, [session]);

  const currentStudent = useMemo(() => {
    if (!session?.studentId) return null;
    return students.find(s => s.id === session.studentId) || null;
  }, [session, students]);

  const coachName = useMemo(() => session?.role === 'coach' ? session.name : null, [session]);

  const weeklyPlan = useMemo(() => {
    if (!currentStudent) return null;
    return weeklyPlans[currentStudent.id] || null;
  }, [currentStudent, weeklyPlans]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const loginWithCredentials = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).single();
    if (!profile) return { success: false, error: 'Profile not found' };
    const nextSession = { profileId: profile.id, role: profile.role, name: profile.name, studentId: profile.student_id || null };
    setSession(nextSession);
    await loadAllData();
    return { success: true, profile: { ...profile, homePath: profile.home_path } };
  }, [loadAllData]);

  const loginAsProfile = useCallback(() => {}, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  // ── Student actions ───────────────────────────────────────────────────────

  const addStudent = useCallback(async (studentData) => {
    const id = studentData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const row = {
      id,
      name: studentData.name,
      email: studentData.email || null,
      initials: studentData.name.charAt(0).toUpperCase() + (studentData.name.split(' ')[1]?.charAt(0).toUpperCase() || ''),
      color: studentData.color || '#C9A84C',
      status: 'Active',
      program: studentData.program || 'Package',
      test_date: studentData.testDate || null,
      target_aa: studentData.targetAA || 400,
      target_sections: studentData.targetSections || {},
      sections: studentData.sections || {},
      weekly_study_hours: studentData.weeklyStudyHours || 20,
      constraints: studentData.constraints || null,
      session_cadence: studentData.sessionCadence || 'Weekly',
    };
    const { data } = await supabase.from('students').insert([row]).select().single();
    if (data) setStudents(prev => [...prev, rowToStudent(data)]);
    return data ? { student: rowToStudent(data) } : null;
  }, []);

  const updateStudent = useCallback(async (studentId, updates) => {
    const rowUpdates = {};
    const map = { testDate: 'test_date', targetAA: 'target_aa', targetSections: 'target_sections', sections: 'sections', weeklyStudyHours: 'weekly_study_hours', sessionCadence: 'session_cadence' };
    Object.entries(updates).forEach(([k, v]) => { rowUpdates[map[k] || k] = v; });
    await supabase.from('students').update(rowUpdates).eq('id', studentId);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
  }, []);

  const updateStudentSections = useCallback(async (studentId, sections) => {
    await supabase.from('students').update({ sections }).eq('id', studentId);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, sections } : s));
  }, []);

  // ── MQL Errors ────────────────────────────────────────────────────────────

  const addMqlError = useCallback(async (error) => {
    if (!currentStudent) return;
    const row = { id: `mql-${Date.now()}`, student_id: currentStudent.id, section: error.section || '', subtopic: error.subtopic || '', source: error.source || '', exam_number: error.examNumber || '', question_number: error.questionNumber || '', error_type: error.errorType || '', confidence_before: error.confidenceBefore || 0, why_missed: error.whyMissed || '', takeaway: error.takeaway || '', reviewed: false, still_weak: false, include_in_next_plan: false, date: new Date().toISOString().split('T')[0] };
    const { data } = await supabase.from('mql_errors').insert([row]).select().single();
    if (data) setMqlErrors(prev => [rowToMqlError(data), ...prev]);
  }, [currentStudent]);

  const addMqlErrorForStudent = useCallback(async (studentId, error) => {
    const row = { id: `mql-${Date.now()}`, student_id: studentId, section: error.section || '', subtopic: error.subtopic || '', source: error.source || '', exam_number: error.examNumber || '', question_number: error.questionNumber || '', error_type: error.errorType || '', confidence_before: error.confidenceBefore || 0, why_missed: error.whyMissed || '', takeaway: error.takeaway || '', reviewed: false, still_weak: false, include_in_next_plan: false, date: new Date().toISOString().split('T')[0] };
    const { data } = await supabase.from('mql_errors').insert([row]).select().single();
    if (data) setMqlErrors(prev => [rowToMqlError(data), ...prev]);
  }, []);

  const updateMqlError = useCallback(async (errorId, updates) => {
    const map = { stillWeak: 'still_weak', includeInNextPlan: 'include_in_next_plan', whyMissed: 'why_missed', errorType: 'error_type' };
    const rowUpdates = {};
    Object.entries(updates).forEach(([k, v]) => { rowUpdates[map[k] || k] = v; });
    await supabase.from('mql_errors').update(rowUpdates).eq('id', errorId);
    setMqlErrors(prev => prev.map(e => e.id === errorId ? { ...e, ...updates } : e));
  }, []);

  const deleteMqlError = useCallback(async (errorId) => {
    await supabase.from('mql_errors').delete().eq('id', errorId);
    setMqlErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  // ── Tasks & Notes ─────────────────────────────────────────────────────────

  const toggleTask = useCallback(async (taskId) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}:${taskId}`;
    const newVal = !taskCompletion[key];
    await supabase.from('task_completions').upsert({ student_id: currentStudent.id, task_id: taskId, completed: newVal }, { onConflict: 'student_id,task_id' });
    setTaskCompletion(prev => ({ ...prev, [key]: newVal }));
  }, [currentStudent, taskCompletion]);

  const saveNote = useCallback(async (dayId, text) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}:${dayId}`;
    await supabase.from('student_notes').upsert({ student_id: currentStudent.id, day_id: dayId, content: text, updated_at: new Date().toISOString() }, { onConflict: 'student_id,day_id' });
    setNotes(prev => ({ ...prev, [key]: text }));
  }, [currentStudent]);

  // ── Check-ins ─────────────────────────────────────────────────────────────

  const submitCheckIn = useCallback(async (studentId, weekId, data) => {
    const row = { student_id: studentId, week_id: weekId, data, submitted_at: new Date().toISOString() };
    await supabase.from('check_ins').upsert(row, { onConflict: 'student_id,week_id' });
    const key = `${studentId}:${weekId}`;
    setCheckIns(prev => ({ ...prev, [key]: { ...data, studentId, weekId, submittedAt: row.submitted_at } }));
  }, []);

  const getCheckIns = useCallback((studentId) => {
    return Object.entries(checkIns)
      .filter(([k]) => k.startsWith(`${studentId}:`))
      .map(([, v]) => v)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [checkIns]);

  const getLatestCheckIn = useCallback((studentId) => {
    const all = getCheckIns(studentId);
    return all[0] || null;
  }, [getCheckIns]);

  // ── Weekly Plans ──────────────────────────────────────────────────────────

  const saveWeeklyPlan = useCallback(async (studentId, plan) => {
    const existing = weeklyPlans[studentId];
    const row = { student_id: studentId, week_of: plan.weekOf || '', week_number: plan.weekNumber || 1, notes: plan.notes || '', blocks: plan.blocks || [], status: plan.status || 'draft', updated_at: new Date().toISOString() };
    if (existing?.id) {
      await supabase.from('weekly_plans').update(row).eq('id', existing.id);
      setWeeklyPlans(prev => ({ ...prev, [studentId]: { ...prev[studentId], ...plan } }));
    } else {
      const { data } = await supabase.from('weekly_plans').insert([row]).select().single();
      if (data) setWeeklyPlans(prev => ({ ...prev, [studentId]: rowToWeeklyPlan(data) }));
    }
  }, [weeklyPlans]);

  const getWeeklyPlan = useCallback((studentId) => weeklyPlans[studentId] || null, [weeklyPlans]);

  const publishWeeklyPlan = useCallback(async (studentId) => {
    const existing = weeklyPlans[studentId];
    if (!existing?.id) return;
    const publishedAt = new Date().toISOString();
    await supabase.from('weekly_plans').update({ status: 'published', published_at: publishedAt }).eq('id', existing.id);
    setWeeklyPlans(prev => ({ ...prev, [studentId]: { ...prev[studentId], status: 'published', publishedAt } }));
  }, [weeklyPlans]);

  // ── Insights ──────────────────────────────────────────────────────────────

  const addInsight = useCallback(async (insight) => {
    const row = { id: insight.id || `insight-${Date.now()}`, student_id: insight.studentId || null, content: insight.content || '', type: insight.type || '', created_at: insight.createdAt || new Date().toISOString() };
    const { data } = await supabase.from('insights').insert([row]).select().single();
    if (data) setInsights(prev => [data, ...prev]);
  }, []);

  const updateInsight = useCallback(async (insightId, updates) => {
    await supabase.from('insights').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', insightId);
    setInsights(prev => prev.map(i => i.id === insightId ? { ...i, ...updates } : i));
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    mode: appConfig.dataSource,
    isDemoMode: false,
    loading,
    session,
    profiles: [],
    students,
    credentials: [],
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
  }), [
    loading, session, students, currentProfile, currentStudent, coachName,
    weeklyPlan, weeklyPlans, insights, taskCompletion, notes, mqlErrors, checkIns,
    loginWithCredentials, logout, addStudent, updateStudent, updateStudentSections,
    toggleTask, saveNote, addMqlError, addMqlErrorForStudent, updateMqlError, deleteMqlError,
    submitCheckIn, getCheckIns, getLatestCheckIn, saveWeeklyPlan, getWeeklyPlan,
    publishWeeklyPlan, addInsight, updateInsight,
  ]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}
