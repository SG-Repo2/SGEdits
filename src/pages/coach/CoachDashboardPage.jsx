import { Link } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { TrendChart } from '../../components/charts/TrendChart';
import { Badge } from '../../components/common/Badge';
import { MetricCard } from '../../components/common/MetricCard';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { getCoachDashboardSnapshot, getCoachNotifications, getStudentInvoiceStatus } from '../../utils/selectors';
import { formatCurrency, formatHours } from '../../utils/formatters';
import { formatDate } from '../../utils/date';

export function CoachDashboardPage() {
  const { students, payments, sessions, weeklyPlans, selfAssessments } = usePortal();
  const dashboard = getCoachDashboardSnapshot({ students, payments, sessions, weeklyPlans, selfAssessments });
  const assessmentNotifications = getCoachNotifications(students, selfAssessments);

  return (
    <div className="page-stack">
      <PageIntro
        actions={
          <Link className="button button--solid button--primary button--md" to="/coach/schedules">
            Plan this week
          </Link>
        }
        description="A calm operational snapshot of tutoring revenue, balances, schedules, and recent student activity."
        eyebrow="Coach Portal"
        title="Operations overview"
      />

      <div className="metric-grid">
        {dashboard.metrics.map((metric) => {
          const displayValue =
            metric.label === 'Active students'
              ? metric.value
              : metric.label === 'Hours delivered'
                ? formatHours(metric.value)
                : formatCurrency(metric.value);

          return <MetricCard helper={metric.helper} key={metric.label} label={metric.label} tone={metric.label === 'Outstanding balance' ? 'danger' : 'default'} value={displayValue} />;
        })}
      </div>

      <div className="dashboard-grid">
        <SectionCard description="Grouped from the seeded payment ledger." title="Revenue trend">
          <TrendChart
            color="#c29a34"
            data={dashboard.revenueSeries.map((point) => ({ label: point.month, revenue: Math.round(point.revenue) }))}
            dataKey="revenue"
            valueType="currency"
          />
        </SectionCard>

        <SectionCard description="Students who still need a published or first-time plan." title="Schedule queue">
          <div className="stack-list">
            {dashboard.scheduleQueue.map((item) => (
              <Link className="list-row list-row--link" key={item.id} to={`/coach/schedules?student=${item.id}`}>
                <div>
                  <p className="list-row__title">{item.name}</p>
                  <p className="list-row__meta">
                    {item.focusArea}
                    {item.weakAreas.length ? ` · Student flagged: ${item.weakAreas.join(', ')}` : ''}
                  </p>
                </div>
                <Badge tone="warning">{item.status}</Badge>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard description="Unread student self-assessments appear here until Thomas reviews them." title="Assessment alerts">
        {assessmentNotifications.length ? (
          <div className="stack-list">
            {assessmentNotifications.map((notification) => (
              <Link className="list-row list-row--link" key={notification.id} to={`/coach/students/${notification.studentId}`}>
                <div>
                  <p className="list-row__title">{notification.studentName} submitted an evaluation</p>
                  <p className="list-row__meta">
                    {notification.weakAreaLabels.length ? `Flagged: ${notification.weakAreaLabels.join(', ')}` : 'New self-assessment response'}
                  </p>
                </div>
                <Badge tone="accent">Needs review</Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state--compact">
            <h3>No pending evaluations</h3>
            <p>New student submissions will show up here and in the header bell.</p>
          </div>
        )}
      </SectionCard>

      <div className="dashboard-grid">
        <SectionCard description="Highest balances surface first so Thomas can work the queue." title="Outstanding balances">
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Paid</th>
                  <th>Owed</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.outstandingStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <Link className="table-link" to={`/coach/students/${student.id}`}>
                        {student.name}
                      </Link>
                    </td>
                    <td>
                      <Badge tone={getStudentInvoiceStatus(student) === 'Outstanding' ? 'danger' : 'warning'}>{getStudentInvoiceStatus(student)}</Badge>
                    </td>
                    <td>{formatCurrency(student.amountPaid)}</td>
                    <td>{formatCurrency(student.amountOwed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard description="Recent payments and sessions from the shared seed modules." title="Recent activity">
          <div className="stack-list">
            {dashboard.recentPayments.map((payment) => (
              <div className="list-row" key={payment.id}>
                <div>
                  <p className="list-row__title">{payment.studentName}</p>
                  <p className="list-row__meta">
                    {payment.kind} via {payment.method} on {formatDate(payment.date)}
                  </p>
                </div>
                <strong>{formatCurrency(payment.amount)}</strong>
              </div>
            ))}
          </div>

          <div className="divider" />

          <div className="stack-list">
            {dashboard.recentSessions.map((session) => (
              <div className="list-row" key={session.id}>
                <div>
                  <p className="list-row__title">{session.studentName}</p>
                  <p className="list-row__meta">
                    {session.topicSummary} · {session.coach}
                  </p>
                </div>
                <div className="list-row__meta">
                  {formatDate(session.date)} · {formatHours(session.hours)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
