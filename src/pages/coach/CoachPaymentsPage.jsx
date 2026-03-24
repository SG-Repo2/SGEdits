import { useMemo } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { Badge } from '../../components/common/Badge';
import { MetricCard } from '../../components/common/MetricCard';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/formatters';
import { getStudentDirectory } from '../../utils/selectors';

export function CoachPaymentsPage() {
  const { students, payments, sessions, weeklyPlans, selfAssessments } = usePortal();
  const roster = useMemo(
    () => getStudentDirectory(students, sessions, payments, weeklyPlans, selfAssessments).sort((left, right) => right.amountOwed - left.amountOwed),
    [payments, selfAssessments, sessions, students, weeklyPlans],
  );

  const livePayments = payments.filter((payment) => !payment.archived);
  const totalCollected = livePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const depositsCollected = livePayments.filter((payment) => payment.kind === 'Deposit').reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingBalance = students.reduce((sum, student) => sum + student.amountOwed, 0);

  return (
    <div className="page-stack">
      <PageIntro
        description="Invoice visibility is derived from seeded students plus the payment log, so the coach view can evolve into a real billing repository later."
        eyebrow="Coach Portal"
        title="Billing"
      />

      <div className="metric-grid metric-grid--three">
        <MetricCard helper={`${livePayments.length} live transactions`} label="Collected to date" value={formatCurrency(totalCollected)} />
        <MetricCard helper="Deposit payments already received" label="Deposits collected" value={formatCurrency(depositsCollected)} />
        <MetricCard helper={`${roster.filter((student) => student.amountOwed > 0).length} open balances`} label="Outstanding balance" tone="danger" value={formatCurrency(outstandingBalance)} />
      </div>

      <SectionCard title="Student invoice status">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Plan</th>
                <th>Paid</th>
                <th>Owed</th>
                <th>Next due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.planType}</td>
                  <td>{formatCurrency(student.amountPaid)}</td>
                  <td>{formatCurrency(student.amountOwed)}</td>
                  <td>{student.nextPaymentAmountLabel || 'TBD'}</td>
                  <td>
                    <Badge tone={student.amountOwed > 0 ? 'warning' : 'success'}>{student.amountOwed > 0 ? 'Open' : 'Paid'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Transaction log">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Kind</th>
                <th>Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...livePayments].reverse().map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.date)}</td>
                  <td>{payment.studentName}</td>
                  <td>{payment.kind}</td>
                  <td>{payment.method}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
