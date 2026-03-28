import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { Calendar, Clock, CheckCircle2, ArrowRight, AlertCircle, Target } from 'lucide-react';

// ── Countdown to DAT test date ───────────────────────────────
function DATCountdown({ testDate }) {
  const info = useMemo(() => {
    if (!testDate) return null;
    const now  = new Date();
    now.setHours(0, 0, 0, 0);
    const test = new Date(testDate);
    test.setHours(0, 0, 0, 0);
    const diff = Math.round((test - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { days: 0, label: 'DAT passed', urgent: false };
    if (diff === 0) return { days: 0, label: 'DAT is TODAY', urgent: true };
    if (diff <= 7)  return { days: diff, label: `${diff}d until DAT`, urgent: true };
    if (diff <= 30) return { days: diff, label: `${diff} days until DAT`, urgent: false };
    const weeks = Math.floor(diff / 7);
    return { days: diff, label: `${weeks} weeks until DAT`, urgent: false };
  }, [testDate]);

  if (!info) return null;

  const formatted = new Date(testDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="panel animate-in" style={{
      marginBottom: 16,
      background: info.urgent
        ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'
        : 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.05))',
      border: `1px solid ${info.urgent ? 'rgba(239,68,68,0.3)' : 'rgba(201,168,76,0.3)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Target size={20} color={info.urgent ? '#ef4444' : '#C9A84C'} />
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '1.8px',
              textTransform: 'uppercase',
              color: info.urgent ? '#ef4444' : '#C9A84C',
              marginBottom: 2,
            }}>
              {info.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>
              Test Date: {formatted}
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800,
          color: info.urgent ? '#ef4444' : 'var(--gold)',
          lineHeight: 1,
        }}>
          {info.days === 0 ? '🎯' : info.days}
        </div>
      </div>
    </div>
  );
}

function normalisePlan(weeklyPlan) {
  if (!weeklyPlan) return null;
  if (Array.isArray(weeklyPlan.days)) {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', { weekday: 'long' });
    const days = weeklyPlan.days.map(d => ({
      ...d,
      isToday: d.isToday ?? (d.label === todayStr),
    }));
    return { ...weeklyPlan, days };
  }
  if (Array.isArray(weeklyPlan.blocks)) {
    const allTasks = weeklyPlan.blocks.map((block, i) => ({
      id:       `block-${i}`,
      text:     `${block.section || 'Study'}: ${(block.topics || []).join(', ')}`,
      cat:      block.section || 'Core',
      mins:     Math.round((block.hours || 1) * 60),
      required: block.priority === 'high',
    }));
    return { ...weeklyPlan, days: [{ label: 'This Week', date: '', isToday: true, tasks: allTasks }] };
  }
  return weeklyPlan;
}

export function StudentDashboard() {
  const { currentStudent, weeklyPlan: rawPlan, taskCompletion, toggleTask } = usePortal();
  const navigate = useNavigate();
  const weeklyPlan = useMemo(() => normalisePlan(rawPlan), [rawPlan]);
  const today     = useMemo(() => weeklyPlan?.days?.find(d => d.isToday) || weeklyPlan?.days?.[0], [weeklyPlan]);
  const allTasks  = useMemo(() => weeklyPlan?.days?.flatMap(d => d.tasks || []) || [], [weeklyPlan]);
  const totalDone  = allTasks.filter(t => taskCompletion[`${currentStudent?.id}:${t.id}`]).length;
  const totalTasks = allTasks.length;
  const weekPct    = totalTasks > 0 ? Math.round(totalDone / totalTasks * 100) : 0;
  const todayTasks    = today?.tasks || [];
  const todayDone     = todayTasks.filter(t => taskCompletion[`${currentStudent?.id}:${t.id}`]).length;
  const todayPct      = todayTasks.length > 0 ? Math.round(todayDone / todayTasks.length * 100) : 0;
  const todayMins     = todayTasks.reduce((a, t) => a + (t.mins || 0), 0);
  const todayDoneMins = todayTasks.filter(t => taskCompletion[`${currentStudent?.id}:${t.id}`]).reduce((a, t) => a + (t.mins || 0), 0);
  const overdueTasks = useMemo(() => {
    if (!weeklyPlan?.days) return [];
    const todayIdx = weeklyPlan.days.findIndex(d => d.isToday);
    if (todayIdx <= 0) return [];
    return weeklyPlan.days.slice(0, todayIdx).flatMap(d =>
      (d.tasks || []).filter(t => !taskCompletion[`${currentStudent?.id}:${t.id}`]).map(t => ({ ...t, dayLabel: d.label }))
    );
  }, [weeklyPlan, taskCompletion, currentStudent?.id]);
  const circumference = 2 * Math.PI * 37;

  if (!currentStudent) {
    return (
      <div style={{ color: 'var(--text-lo)', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>Loading your profile…</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>If this persists, try logging out and back in.</div>
      </div>
    );
  }

  if (!weeklyPlan) {
    return (
      <div style={{ color: 'var(--text-lo)', padding: 40, textAlign: 'center' }}>
        <DATCountdown testDate={currentStudent.testDate} />
        <div style={{ fontSize: 32, marginBottom: 12, marginTop: 24 }}>📋</div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>No active plan this week</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your coach will publish a plan soon. Check back shortly!</div>
      </div>
    );
  }

  if (weeklyPlan.status === 'draft') {
    return (
      <div style={{ color: 'var(--text-lo)', padding: 40, textAlign: 'center' }}>
        <DATCountdown testDate={currentStudent.testDate} />
        <div style={{ fontSize: 32, marginBottom: 12, marginTop: 24 }}>🔒</div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>Your plan is being finalized</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your coach is reviewing the plan and will publish it soon.</div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <DATCountdown testDate={currentStudent.testDate} />
      <div className="prog-header" style={{ marginBottom: 18 }}>
        <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
            <circle className="ring-bg" cx="44" cy="44" r="37" />
            <circle className="ring-fill" cx="44" cy="44" r="37"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * weekPct / 100)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: 'var(--text-hi)', lineHeight: 1 }}>{weekPct}%</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 3 }}>Done</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 7 }}>{weeklyPlan.weekLabel}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: 'var(--text-hi)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 5 }}>{weeklyPlan.title || 'Weekly Study Plan'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-lo)', fontWeight: 300 }}>
            {today?.label ? `Today is ${today.label}` : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}{today?.date ? `, ${today.date}` : ''}
          </div>
          <div className="progress-bar" style={{ marginTop: 11 }}>
            <div className="progress-fill" style={{ width: `${weekPct}%`, background: 'linear-gradient(90deg, rgba(201,168,76,0.5), rgba(201,168,76,0.9))' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>{totalDone}</span> of {totalTasks} tasks complete this week
          </div>
        </div>
      </div>

      {currentStudent.coachNote && (
        <div className="coach-card animate-in" style={{ animationDelay: '0.05s', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 13 }}>
            <div className="coach-avatar">{currentStudent.name?.charAt(0).toUpperCase() || 'C'}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--gold-dim)' }}>Coach Note — {currentStudent.phase || 'Foundation'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 2 }}>{currentStudent.program || 'DAT Prep'}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7 }}>{currentStudent.coachNote}</div>
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div className="panel animate-in" style={{ animationDelay: '0.08s', marginBottom: 16, borderColor: 'rgba(239,68,68,0.25)' }}>
          <div className="panel-header" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} color="#ef4444" />
              <div className="panel-title" style={{ color: '#ef4444' }}>Overdue from earlier this week</div>
            </div>
          </div>
          {overdueTasks.slice(0, 3).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-faint)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{t.text}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t.dayLabel}</div>
              </div>
            </div>
          ))}
          {overdueTasks.length > 3 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>+{overdueTasks.length - 3} more overdue tasks</div>}
        </div>
      )}

      <div className="panel animate-in" style={{ animationDelay: '0.1s', marginBottom: 16 }}>
        <div className="panel-header" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="var(--gold-dim)" />
            <div className="panel-title">Today's Study Plan</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-lo)' }}>
              <Clock size={12} />{todayDoneMins}/{todayMins}m
            </div>
            <div style={{ fontSize: 12, color: 'var(--gold-dim)', fontWeight: 600 }}>{todayPct}%</div>
          </div>
        </div>
        {todayTasks.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>No tasks scheduled for today.</div>
        ) : (
          todayTasks.map((task) => {
            const key  = `${currentStudent.id}:${task.id}`;
            const done = !!taskCompletion[key];
            return (
              <div key={task.id} onClick={() => toggleTask(task.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-faint)', cursor: 'pointer', opacity: done ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${done ? 'var(--gold)' : 'var(--border)'}`, background: done ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                  {done && <CheckCircle2 size={12} color="#0d0d12" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-hi)', fontWeight: done ? 400 : 500, textDecoration: done ? 'line-through' : 'none' }}>{task.text}</div>
                  {task.section && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{task.section}</div>}
                </div>
                {task.mins > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{task.mins}m</div>}
              </div>
            );
          })
        )}
        {todayTasks.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${todayPct}%` }} /></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{todayDone} of {todayTasks.length} complete today</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button className="panel" onClick={() => navigate('/student/weekly-plan')} style={{ textAlign: 'left', cursor: 'pointer', background: 'none', border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 5 }}>Full Week Plan</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>View all days <ArrowRight size={13} /></div>
        </button>
        <button className="panel" onClick={() => navigate('/student/check-in')} style={{ textAlign: 'left', cursor: 'pointer', background: 'none', border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 5 }}>Weekly Check-In</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>Submit update <ArrowRight size={13} /></div>
        </button>
      </div>
    </div>
  );
}
