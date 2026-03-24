import { getPlanId, summarizeWeeklyPlan } from '../features/schedules/utils';
import { summarizeAssessment } from '../features/assessments/utils';
import { compareByDateAsc, compareByDateDesc, formatMonthKey, getStartOfWeek, toISODate } from './date';

export function getStudentMap(students) {
  return students.reduce((collection, student) => {
    collection[student.id] = student;
    return collection;
  }, {});
}

export function getStudentSessions(sessions, studentId) {
  return sessions
    .filter((session) => session.studentId === studentId)
    .sort((left, right) => compareByDateDesc(left.date, right.date));
}

export function getStudentPayments(payments, studentId) {
  return payments
    .filter((payment) => payment.studentId === studentId)
    .sort((left, right) => compareByDateDesc(left.date, right.date));
}

export function getRevenueSeries(payments) {
  const grouped = payments
    .filter((payment) => !payment.archived)
    .sort((left, right) => compareByDateAsc(left.date, right.date))
    .reduce((collection, payment) => {
      const key = formatMonthKey(payment.date);
      collection[key] = (collection[key] || 0) + payment.amount;
      return collection;
    }, {});

  return Object.entries(grouped).map(([month, revenue]) => ({ month, revenue }));
}

export function getStudentProgressSeries(student) {
  const baseline = 360 + Number(student.id.replace(/\D/g, '')) * 3;
  const pace = Math.max(8, Math.round((student.predictedScore || 18) / 2));
  return Array.from({ length: 5 }, (_, index) => ({
    label: `Week ${index + 1}`,
    score: baseline + pace * index,
  }));
}

export function getStudentInvoiceStatus(student) {
  if (!student.amountOwed && student.amountPaid > 0) return 'Paid';
  if (student.amountPaid > 0 && student.amountOwed > 0) return 'Partial';
  if (student.amountOwed > 0) return 'Outstanding';
  return 'Draft';
}

export function getCurrentWeeklyPlan(weeklyPlans, studentId, weekStart = getStartOfWeek()) {
  const key = getPlanId(studentId, typeof weekStart === 'string' ? weekStart : toISODate(weekStart));
  return weeklyPlans[key] || null;
}

export function getStudentDirectory(students, sessions, payments, weeklyPlans, selfAssessments = {}) {
  return students.map((student) => {
    const studentSessions = getStudentSessions(sessions, student.id);
    const studentPayments = getStudentPayments(payments, student.id);
    const currentPlan = getCurrentWeeklyPlan(weeklyPlans, student.id);
    const planSummary = summarizeWeeklyPlan(currentPlan);
    const assessmentSummary = summarizeAssessment(student, selfAssessments[student.id]);

    return {
      ...student,
      sessionCount: studentSessions.length,
      paymentCount: studentPayments.length,
      latestSession: studentSessions[0] || null,
      latestPayment: studentPayments[0] || null,
      invoiceStatus: getStudentInvoiceStatus(student),
      currentPlan,
      currentPlanSummary: planSummary,
      assessmentSummary,
    };
  });
}

export function getCoachDashboardSnapshot({ students, payments, sessions, weeklyPlans, selfAssessments = {} }) {
  const roster = getStudentDirectory(students, sessions, payments, weeklyPlans, selfAssessments);
  const totalCollected = payments.filter((payment) => !payment.archived).reduce((sum, payment) => sum + payment.amount, 0);
  const totalOutstanding = students.reduce((sum, student) => sum + student.amountOwed, 0);
  const deliveredHours = sessions.reduce((sum, session) => sum + session.hours, 0);
  const activeStudents = students.filter((student) => ['Active', 'Pending'].includes(student.status)).length;

  return {
    metrics: [
      { label: 'Collected to date', value: totalCollected, helper: `${payments.filter((payment) => !payment.archived).length} recorded payments` },
      { label: 'Active students', value: activeStudents, helper: `${students.length} total seeded profiles` },
      { label: 'Outstanding balance', value: totalOutstanding, helper: `${roster.filter((student) => student.amountOwed > 0).length} students with open balances` },
      { label: 'Hours delivered', value: deliveredHours, helper: `${sessions.length} logged sessions` },
    ],
    revenueSeries: getRevenueSeries(payments),
    outstandingStudents: [...roster].filter((student) => student.amountOwed > 0).sort((left, right) => right.amountOwed - left.amountOwed).slice(0, 6),
    recentPayments: [...payments].filter((payment) => !payment.archived).sort((left, right) => compareByDateDesc(left.date, right.date)).slice(0, 6),
    recentSessions: [...sessions].sort((left, right) => compareByDateDesc(left.date, right.date)).slice(0, 6),
    scheduleQueue: roster
      .filter((student) => !student.currentPlan || !student.currentPlan.published)
      .slice(0, 6)
      .map((student) => ({
        id: student.id,
        name: student.name,
        status: student.currentPlan ? 'Draft plan ready to publish' : 'Needs a weekly plan',
        focusArea: student.focusArea,
        weakAreas: student.assessmentSummary?.weakAreaLabels || [],
      })),
  };
}

export function getCoachNotifications(students, selfAssessments = {}) {
  const studentMap = getStudentMap(students);

  return Object.values(selfAssessments)
    .filter((assessment) => assessment?.coachUnread || assessment?.status === 'submitted')
    .map((assessment) => {
      const student = studentMap[assessment.studentId];
      const summary = student ? summarizeAssessment(student, assessment) : null;

      return {
        id: `assessment-${assessment.studentId}`,
        type: 'assessment_submitted',
        studentId: assessment.studentId,
        studentName: student?.name || 'Student',
        submittedAt: assessment.submittedAt || assessment.updatedAt,
        status: assessment.status,
        weakAreaLabels: summary?.weakAreaLabels || [],
        challengeLabels: summary?.concernLabels || [],
      };
    })
    .sort((left, right) => compareByDateDesc(left.submittedAt, right.submittedAt));
}
