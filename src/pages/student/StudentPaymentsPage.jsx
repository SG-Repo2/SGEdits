import { usePortal } from '../../app/providers/PortalProvider';
import { EmptyState } from '../../components/common/EmptyState';
import { MetricCard } from '../../components/common/MetricCard';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/formatters';
import { getStudentPayments } from '../../utils/selectors';

export function StudentPaymentsPage() {
  const { currentStudent, payments } = usePortal();

  if (!currentStudent) {
    return <EmptyState description="Choose a student demo profile to view billing." title="Student profile missing" />;
  }

  const studentPayments = getStudentPayments(payments, currentStudent.id);
  const contractValue = currentStudent.amountPaid + currentStudent.amountOwed;

  return (
    <div className="page-stack">
      <PageIntro
        description="Students can see what has been paid, what remains open, and the latest invoice activity without needing the coach to send screenshots."
        eyebrow="Student Portal"
        title="Billing"
      />

      <div className="metric-grid metric-grid--three">
        <MetricCard helper="Paid to date" label="Amount paid" value={formatCurrency(currentStudent.amountPaid)} />
        <MetricCard helper="Current open balance" label="Amount owed" tone={currentStudent.amountOwed > 0 ? 'danger' : 'default'} value={formatCurrency(currentStudent.amountOwed)} />
        <MetricCard helper={currentStudent.nextPaymentAmountLabel || 'No amount scheduled'} label="Contract value" value={formatCurrency(contractValue)} />
      </div>

      <SectionCard title="Payment history">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {studentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.date)}</td>
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
