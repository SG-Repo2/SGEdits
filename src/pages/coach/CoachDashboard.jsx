import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, Users } from 'lucide-react';
import { usePortal } from '../../app/providers/PortalProvider';
import { formatCurrency } from '../../utils/formatters';

export function CoachDashboard() {
  const { session, students, weeklyPlans, practiceTests } = usePortal();
  const navigate = useNavigate();

  const activeStudents = useMemo(
    () => students.filter((student) => student.status !== 'Archived'),
    [students],
  );

  const currentWeekPlans = useMemo(() => (
    Object.values(weeklyPlans || {}).filter((plan) => plan?.status === 'published')
  ), [weeklyPlans]);

  const outstandingBalance = activeStudents.reduce(
    (sum, student) => sum + (Number(student.remainingBalance) || 0),
    0,
  );

  const nextPayments = [...activeStudents]
    .filter((student) => student.nextPaymentDate)
    .sort((left, right) => new Date(left.nextPaymentDate) - new Date(right.nextPaymentDate))
    .slice(0, 5);

  return (
    <div className="animate-in">
      <div style={{
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-border)',
        borderRadius: 'var(--r-xl)',
        padding: '32px 36px',
        marginBottom: 28,
      }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 16 }}>
          Ace The DAT · Manual Coaching System
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 6 }}>
          Welcome back, {session?.name || 'Coach'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-lo)', lineHeight: 1.6 }}>
          Coach visibility now runs through real student records, published weekly plans, practice test logs, MQL entries, and manual payments.
        </div>
      </div>

      <div className="stat-grid stat-grid-4">
        <div className="stat-card">
          <div className="stat-card-label">Student Roster</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{activeStudents.length}</div>
          <div className="stat-card-sub">active student records</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Published Plans</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{currentWeekPlans.length}</div>
          <div className="stat-card-sub">visible to students</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Practice Tests Logged</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{practiceTests.length}</div>
          <div className="stat-card-sub">manual entries stored</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Outstanding Balance</div>
          <div className="stat-card-value" style={{ color: outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(outstandingBalance)}
          </div>
          <div className="stat-card-sub">manual payment tracking</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 1fr)', gap: 18, alignItems: 'start' }}>
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={16} style={{ color: 'var(--gold)' }} />
              <span className="panel-title">Student Roster</span>
            </div>
            <button className="btn btn-gold" onClick={() => navigate('/coach/students')} style={{ fontSize: 12, padding: '6px 14px' }}>
              Open Students
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeStudents.slice(0, 6).map((student) => {
              const studentPlan = Object.values(weeklyPlans || {}).find((plan) => plan.studentId === student.id);
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => navigate(`/coach/students/${student.id}`)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    background: 'var(--bg-panel-hover)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 14,
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: `${student.color}20`,
                    border: `1.5px solid ${student.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    color: student.color,
                  }}
                  >
                    {student.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 4 }}>
                      {student.name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="tag tag-muted">{student.program || 'DAT Coaching'}</span>
                      <span className={`tag ${studentPlan?.status === 'published' ? 'tag-success' : 'tag-gold'}`}>
                        {studentPlan?.status === 'published' ? 'Plan live' : 'Needs plan review'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>Balance</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: student.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {formatCurrency(student.remainingBalance || 0)}
                    </div>
                  </div>
                </button>
              );
            })}
            {activeStudents.length === 0 && (
              <div style={{ padding: '24px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
                Create your first student from the Students page to start the manual workflow.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarDays size={16} style={{ color: 'var(--gold)' }} />
                <span className="panel-title">Calendar</span>
              </div>
            </div>
            <div style={{
              padding: '18px 16px',
              borderRadius: 12,
              background: 'var(--bg-panel-hover)',
              border: '1px dashed var(--border)',
              color: 'var(--text-lo)',
              lineHeight: 1.7,
              fontSize: 13,
            }}
            >
              Placeholder slot for calendar integration. Weekly planning is already student-specific, so this panel can later surface live coaching sessions without changing the data model.
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CreditCard size={16} style={{ color: 'var(--gold)' }} />
                <span className="panel-title">Upcoming Payments</span>
              </div>
              <button className="btn btn-subtle" onClick={() => navigate('/coach/payments')} style={{ fontSize: 12, padding: '6px 14px' }}>
                Manage Payments
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nextPayments.length > 0 ? nextPayments.map((student) => (
                <div
                  key={student.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-panel-hover)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>{student.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>
                    Next payment: {student.nextPaymentDate}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                    Remaining balance: {formatCurrency(student.remainingBalance || 0)}
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No next payment dates are set yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
