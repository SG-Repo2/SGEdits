export function createSupabasePortalRepository() {
  return {
    mode: 'supabase',
    getProfiles() {
      throw new Error('Supabase repository not configured yet.');
    },
    getStudents() {
      throw new Error('Supabase repository not configured yet.');
    },
    getSessions() {
      throw new Error('Supabase repository not configured yet.');
    },
    getPayments() {
      throw new Error('Supabase repository not configured yet.');
    },
    getSession() {
      return null;
    },
    saveSession() {
      throw new Error('Supabase repository not configured yet.');
    },
    clearSession() {},
    getWeeklyPlans() {
      throw new Error('Supabase repository not configured yet.');
    },
    saveWeeklyPlans() {
      throw new Error('Supabase repository not configured yet.');
    },
    resetWeeklyPlans() {
      throw new Error('Supabase repository not configured yet.');
    },
    getSelfAssessments() {
      throw new Error('Supabase repository not configured yet.');
    },
    saveSelfAssessments() {
      throw new Error('Supabase repository not configured yet.');
    },
    resetSelfAssessments() {
      throw new Error('Supabase repository not configured yet.');
    },
  };
}
