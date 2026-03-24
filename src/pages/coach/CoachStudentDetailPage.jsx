import { Link, useParams } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { MetricCard } from '../../components/common/MetricCard';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { getAssessmentStatusLabel, summarizeAssessment } from '../../features/assessments/utils';
import { formatDate } from '../../utils/date';
import { formatCurrency, formatHours, formatPercent } from '../../utils/formatters';
import { getCurrentWeeklyPlan, getStudentPayments, getStudentSessions } from '../../utils/selectors';
import { summarizeWeeklyPlan } from '../../features/schedules/utils';

export function CoachStudentDetailPage() {
  const { studentId } = useParams();
  const { students, sessions, payments, weeklyPlans, selfAssessments, markAssessmentReviewed } = usePortal();
  const student = students.find((item) => item.id === studentId);

  if (!student) {
    return <EmptyState description="The requested student record is not present in the current seed data." title="Student not found" />;
  }

  const studentSessions = getStudentSessions(sessions, student.id);
  const studentPayments = getStudentPayments(payments, student.id);
  const currentPlan = getCurrentWeeklyPlan(weeklyPlans, student.id);
  const planSummary = summarizeWeeklyPlan(currentPlan);
  const assessmentSummary = summarizeAssessment(student, selfAssessments[student.id]);

  return (
    <div className="page-stack">
      <PageIntro
        actions={
          <Link className="button button--outline button--accent button--md" to={`/coach/schedules?student=${student.id}`}>
            Open weekly plan
          </Link>
        }
        description={student.notes}
        eyebrow="Student Detail"
        title={student.name}
      />

      <div className="metric-grid metric-grid--three">
        <MetricCard helper={student.planType} label="Hours used" value={formatHours(student.hoursUsed)} />
        <MetricCard helper="Collected so far" label="Amount paid" value={formatCurrency(student.amountPaid)} />
        <MetricCard helper={student.nextPaymentAmountLabel || 'No next payment scheduled'} label="Amount owed" tone={student.amountOwed > 0 ? 'danger' : 'default'} value={formatCurrency(student.amountOwed)} />
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Profile">
          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>
                <Badge tone={student.amountOwed > 0 ? 'warning' : 'success'}>{student.status}</Badge>
              </dd>
            </div>
            <div>
              <dt>Coach team</dt>
              <dd>
                {student.primaryCoach}
                {student.supportCoach ? ` + ${student.supportCoach}` : ''}
              </dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{student.planType}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{student.focusArea}</dd>
            </div>
            <div>
              <dt>Target exam</dt>
              <dd>{student.targetExamDate ? formatDate(student.targetExamDate) : 'TBD'}</dd>
            </div>
            <div>
              <dt>Predicted score</dt>
              <dd>
                {student.predictedScore} / goal {student.goalScore}
              </dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Current weekly plan">
          {currentPlan ? (
            <div className="stack-list">
              <div className="list-row">
                <div>
                  <p className="list-row__title">{currentPlan.published ? 'Published to student' : 'Draft plan'}</p>
                  <p className="list-row__meta">{currentPlan.coachNote}</p>
                </div>
                <Badge tone={currentPlan.published ? 'success' : 'warning'}>{currentPlan.published ? 'Live' : 'Draft'}</Badge>
              </div>
              <div className="detail-grid">
                <div>
                  <p className="label">Completion</p>
                  <strong>{formatPercent(planSummary.completionRate)}</strong>
                </div>
                <div>
                  <p className="label">Planned hours</p>
                  <strong>{formatHours(planSummary.totalHours)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              action={<Link className="text-link" to={`/coach/schedules?student=${student.id}`}>Create this week&apos;s plan</Link>}
              description="No weekly plan exists for the current week yet."
              title="Schedule not created"
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        actions={
          assessmentSummary?.status === 'submitted' ? (
            <Button onClick={() => markAssessmentReviewed(student.id)} tone="neutral" variant="outline">
              Mark reviewed
            </Button>
          ) : null
        }
        title="Student self-assessment"
      >
        {assessmentSummary ? (
          <div className="stack-list">
            <div className="list-row">
              <div>
                <p className="list-row__title">Prefill issue areas</p>
                <p className="list-row__meta">
                  {assessmentSummary.weakAreaLabels.length
                    ? assessmentSummary.weakAreaLabels.join(', ')
                    : 'No section issues identified'}
                </p>
              </div>
              <div className="tag-row">
                <Badge tone={assessmentSummary.status === 'submitted' ? 'accent' : assessmentSummary.status === 'reviewed' ? 'success' : 'warning'}>
                  {getAssessmentStatusLabel(assessmentSummary.status)}
                </Badge>
                <Badge tone="neutral">
                  Updated {formatDate(assessmentSummary.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Badge>
              </div>
            </div>

            <div className="tag-row">
              {assessmentSummary.concernLabels.map((label) => (
                <Badge key={label} tone="warning">
                  {label}
                </Badge>
              ))}
            </div>

            <div className="stack-list stack-list--tight">
              {assessmentSummary.ratings
                .sort((left, right) => left.score - right.score)
                .map((rating) => (
                  <div className="list-row" key={rating.section}>
                    <div>
                      <p className="list-row__title">{rating.sectionLabel}</p>
                      <p className="list-row__meta">{rating.scoreLabel}</p>
                    </div>
                    <Badge tone={rating.score <= 2 ? 'danger' : rating.score === 3 ? 'warning' : 'success'}>
                      {rating.score}/5
                    </Badge>
                  </div>
                ))}
            </div>

            {assessmentSummary.note ? (
              <div className="inline-note">
                <p className="section-label">Student note</p>
                <p>{assessmentSummary.note}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState compact description="This student has not submitted a self-assessment yet." title="No assessment on file" />
        )}
      </SectionCard>

      <div className="dashboard-grid">
        <SectionCard title={`Recent sessions (${studentSessions.length})`}>
          <div className="stack-list">
            {studentSessions.slice(0, 6).map((session) => (
              <div className="list-row" key={session.id}>
                <div>
                  <p className="list-row__title">{session.topicSummary}</p>
                  <p className="list-row__meta">
                    {formatDate(session.date)} · {session.coach}
                  </p>
                </div>
                <div className="list-row__meta">
                  {formatHours(session.hours)} · {session.status}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={`Payment history (${studentPayments.length})`}>
          <div className="stack-list">
            {studentPayments.slice(0, 6).map((payment) => (
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
