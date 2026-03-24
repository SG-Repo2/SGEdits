import { usePortal } from '../../app/providers/PortalProvider';
import { TrendChart } from '../../components/charts/TrendChart';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { MetricCard } from '../../components/common/MetricCard';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { getAssessmentStatusLabel, summarizeAssessment } from '../../features/assessments/utils';
import { formatDate } from '../../utils/date';
import { formatCurrency, formatHours } from '../../utils/formatters';
import { getCurrentWeeklyPlan, getStudentPayments, getStudentProgressSeries, getStudentSessions } from '../../utils/selectors';
import { summarizeWeeklyPlan } from '../../features/schedules/utils';

export function StudentDashboardPage() {
  const { currentStudent, currentAssessment, sessions, payments, weeklyPlans } = usePortal();

  if (!currentStudent) {
    return <EmptyState description="Select a student profile from demo mode to open the student dashboard." title="Student profile missing" />;
  }

  const studentSessions = getStudentSessions(sessions, currentStudent.id);
  const studentPayments = getStudentPayments(payments, currentStudent.id);
  const currentPlan = getCurrentWeeklyPlan(weeklyPlans, currentStudent.id);
  const planSummary = summarizeWeeklyPlan(currentPlan);
  const assessmentSummary = summarizeAssessment(currentStudent, currentAssessment);
  const scoreSeries = getStudentProgressSeries(currentStudent).map((point) => ({ label: point.label, score: point.score }));

  return (
    <div className="page-stack">
      <PageIntro
        description="A student-facing snapshot of study progress, this week’s plan, and current payment visibility."
        eyebrow="Student Portal"
        title={`Welcome, ${currentStudent.name}`}
      />

      <div className="metric-grid metric-grid--three">
        <MetricCard helper={currentStudent.packageHours ? `of ${currentStudent.packageHours}h package` : 'Hourly plan'} label="Hours completed" value={formatHours(currentStudent.hoursUsed)} />
        <MetricCard helper="Total paid so far" label="Investment to date" value={formatCurrency(currentStudent.amountPaid)} />
        <MetricCard helper={currentStudent.nextPaymentAmountLabel || 'No next payment set'} label="Open balance" tone={currentStudent.amountOwed > 0 ? 'danger' : 'default'} value={formatCurrency(currentStudent.amountOwed)} />
      </div>

      <div className="dashboard-grid">
        <SectionCard description={`Predicted score ${currentStudent.predictedScore} · goal ${currentStudent.goalScore}`} title="Momentum">
          <TrendChart color="#2f6c4f" data={scoreSeries} dataKey="score" />
        </SectionCard>

        <SectionCard title="This week">
          {currentPlan && currentPlan.published ? (
            <div className="stack-list">
              <div className="list-row">
                <div>
                  <p className="list-row__title">Published weekly plan</p>
                  <p className="list-row__meta">{currentPlan.coachNote}</p>
                </div>
                <Badge tone="success">Live</Badge>
              </div>
              <div className="detail-grid">
                <div>
                  <p className="label">Progress</p>
                  <strong>{Math.round(planSummary.completionRate)}%</strong>
                </div>
                <div>
                  <p className="label">Planned hours</p>
                  <strong>{formatHours(planSummary.totalHours)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState compact description="Your coach hasn’t published a plan for this week yet." title="Weekly plan coming soon" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Your latest self-assessment">
        {assessmentSummary ? (
          <div className="list-row">
            <div>
              <p className="list-row__title">Coach-facing issue areas</p>
              <p className="list-row__meta">
                {assessmentSummary.weakAreaLabels.length
                  ? assessmentSummary.weakAreaLabels.join(', ')
                  : 'No issue areas saved yet'}
              </p>
            </div>
            <div className="tag-row">
              <Badge tone={assessmentSummary.status === 'submitted' ? 'accent' : assessmentSummary.status === 'reviewed' ? 'success' : 'warning'}>
                {getAssessmentStatusLabel(assessmentSummary.status)}
              </Badge>
              {assessmentSummary.weakAreaLabels.map((label) => (
                <Badge key={label} tone="warning">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState compact description="Fill out your self-assessment so your coach can use your own input when planning the week." title="No self-assessment yet" />
        )}
      </SectionCard>

      <div className="dashboard-grid">
        <SectionCard title="Recent sessions">
          <div className="stack-list">
            {studentSessions.slice(0, 5).map((session) => (
              <div className="list-row" key={session.id}>
                <div>
                  <p className="list-row__title">{session.topicSummary}</p>
                  <p className="list-row__meta">{formatDate(session.date)}</p>
                </div>
                <span>{formatHours(session.hours)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Billing snapshot">
          <div className="stack-list">
            {studentPayments.slice(0, 5).map((payment) => (
              <div className="list-row" key={payment.id}>
                <div>
                  <p className="list-row__title">{payment.kind}</p>
                  <p className="list-row__meta">
                    {payment.method} · {formatDate(payment.date)}
                  </p>
                </div>
                <strong>{formatCurrency(payment.amount)}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
