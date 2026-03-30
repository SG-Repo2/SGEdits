import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, LineChart, NotebookText } from 'lucide-react';
import { usePortal } from '../../app/providers/PortalProvider';
import { formatCurrency } from '../../utils/formatters';

export function StudentDashboard() {
  const {
    currentStudent,
    weeklyPlan,
    taskCompletion,
    practiceTests,
    mqlEntries,
  } = usePortal();
  const navigate = useNavigate();

  const today = useMemo(
    () => weeklyPlan?.days?.find((day) => day.isToday) || weeklyPlan?.days?.[0] || null,
    [weeklyPlan],
  );

  const allTasks = weeklyPlan?.days?.flatMap((day) => day.tasks || []) || [];
  const completedTasks = currentStudent
    ? allTasks.filter((task) => taskCompletion[`${currentStudent.id}:${task.id}`]).length
    : 0;
  const studentTests = currentStudent
    ? practiceTests.filter((test) => test.studentId === currentStudent.id)
    : [];
  const studentMqlEntries = currentStudent
    ? mqlEntries.filter((entry) => entry.studentId === currentStudent.id)
    : [];
  const latestTest = studentTests[studentTests.length - 1] || null;

  if (!currentStudent) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>Loading your profile...</div>;
  }

  return (
    <div className="animate-in">
      <div style={{
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-border)',
        borderRadius: 'var(--r-xl)',
        padding: '28px 32px',
        marginBottom: 24,
      }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 14 }}>
          Student Portal
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>
          {currentStudent.name}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-lo)', lineHeight: 1.7 }}>
          This portal shows your real weekly plan, practice tests, MQL entries, and payment status. Everything here is manual and shared with your coach.
        </div>
      </div>

      <div className="stat-grid stat-grid-4" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-card-label">Weekly Plan</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{weeklyPlan ? weeklyPlan.status : 'none'}</div>
          <div className="stat-card-sub">{completedTasks}/{allTasks.length} tasks complete</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Practice Tests</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{studentTests.length}</div>
          <div className="stat-card-sub">{latestTest ? `latest PT ${latestTest.testNumber}` : 'no tests yet'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">MQL Entries</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{studentMqlEntries.length}</div>
          <div className="stat-card-sub">manual missed question log</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Remaining Balance</div>
          <div className="stat-card-value" style={{ color: currentStudent.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(currentStudent.remainingBalance || 0)}
          </div>
          <div className="stat-card-sub">{currentStudent.nextPaymentDate || 'no payment date set'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 18, alignItems: 'start', marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Today&apos;s Plan</span>
          </div>
          {today ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>{today.label}</div>
              {(today.tasks || []).length > 0 ? today.tasks.map((task) => {
                const done = !!taskCompletion[`${currentStudent.id}:${task.id}`];
                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-panel-hover)',
                      opacity: done ? 0.55 : 1,
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--text-hi)', textDecoration: done ? 'line-through' : 'none' }}>
                      {task.text}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {task.minutes ?? task.mins ?? 0} minutes
                    </div>
                  </div>
                );
              }) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No tasks scheduled for today.
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No weekly plan has been published yet.
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Quick Access</span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Weekly Plan', icon: CalendarDays, to: '/student/weekly-plan' },
              { label: 'Practice Tests', icon: LineChart, to: '/student/practice-tests' },
              { label: 'MQL', icon: NotebookText, to: '/student/mql' },
              { label: 'Payments', icon: CreditCard, to: '/student/payments' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-panel-hover)',
                    color: 'var(--text-hi)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={16} color="var(--gold)" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentStudent.coachNote && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Coach Note</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.8 }}>
            {currentStudent.coachNote}
          </div>
        </div>
      )}
    </div>
  );
}
