import { demoProfiles } from '../../data/demoUsers';
import { payments } from '../../data/payments';
import { sessions } from '../../data/sessions';
import { selfAssessments as seededSelfAssessments } from '../../data/selfAssessments';
import { students } from '../../data/students';
import { weeklyPlans as seededWeeklyPlans } from '../../data/weeklyPlans';

const STORAGE_KEYS = {
  session: 'acethedat.portal.session',
  weeklyPlans: 'acethedat.portal.weeklyPlans',
  selfAssessments: 'acethedat.portal.selfAssessments',
};

export function createDemoPortalRepository({ storage }) {
  return {
    mode: 'demo',
    getProfiles() {
      return demoProfiles;
    },
    getStudents() {
      return students;
    },
    getSessions() {
      return sessions;
    },
    getPayments() {
      return payments;
    },
    getSession() {
      return storage.getJSON(STORAGE_KEYS.session, null);
    },
    saveSession(session) {
      storage.setJSON(STORAGE_KEYS.session, session);
      return session;
    },
    clearSession() {
      storage.remove(STORAGE_KEYS.session);
    },
    getWeeklyPlans() {
      return storage.getJSON(STORAGE_KEYS.weeklyPlans, seededWeeklyPlans);
    },
    saveWeeklyPlans(nextPlans) {
      storage.setJSON(STORAGE_KEYS.weeklyPlans, nextPlans);
      return nextPlans;
    },
    resetWeeklyPlans() {
      storage.remove(STORAGE_KEYS.weeklyPlans);
      return seededWeeklyPlans;
    },
    getSelfAssessments() {
      return storage.getJSON(STORAGE_KEYS.selfAssessments, seededSelfAssessments);
    },
    saveSelfAssessments(nextAssessments) {
      storage.setJSON(STORAGE_KEYS.selfAssessments, nextAssessments);
      return nextAssessments;
    },
    resetSelfAssessments() {
      storage.remove(STORAGE_KEYS.selfAssessments);
      return seededSelfAssessments;
    },
  };
}
