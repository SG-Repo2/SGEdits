import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { TASK_CATEGORIES } from '../../data/seedData';
import { Calendar, Clock, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

export function StudentDashboard() {
  const { currentStudent, weeklyPlan, taskCompletion, toggleTask } = usePortal();
  const navigate = useNavigate();

  const today = weeklyPlan?.days?.find(d => d.isToday) || weeklyPlan?.days?.[0];
  const allTasks = weeklyPlan?.days?.flatMap(d => d.tasks) || [];
  const totalDone = allTasks.filter(t => taskCompletion[t.id]).length;
  const totalTasks = allTasks.length;
  const weekPct = totalTasks > 0 ? Math.round(totalDone / totalTasks * 100) : 0;

  const todayTasks = today?.tasks || [];
  const todayDone = todayTasks.filter(t => taskCompletion[t.id]).length;
  const todayPct = todayTasks.length > 0 ? Math.round(todayDone / todayTasks.length * 100) : 0;
  const todayMins = todayTasks.reduce((a, t) => a + (t.mins || 0), 0);
  const todayDoneMins = todayTasks.filter(t => taskCompletion[t.id]).reduce((a, t) => a + (t.mins || 0), 0);

  const overdueTasks = useMemo(() => {
    if (!weeklyPlan?.days) return [];
    const todayIdx = weeklyPlan.days.findIndex(d => d.isToday);
    if (todayIdx <= 0) return [];
    return weeklyPlan.days.slice(0, todayIdx).flatMap(d =>
      d.tasks.filter(t => !taskCompletion[t.id]).map(t => ({ ...t, dayLabel: d.label }))
    );
  }, [weeklyPlan, taskCompletion]);

  const circumference = 2 * Math.PI * 37;

  if (!currentStudent || !weeklyPlan) {
    return <div style={{ color: 'var(--text-lo)', padding: 40 }}>No active plan found.</div>;
  }

  return (
    <div className="animate-in">
      {/* Progress Header */}
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
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 7 }}>
            {weeklyPlan.weekLabel}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: 'var(--text-hi)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 5 }}>
            {weeklyPlan.title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-lo)', fontWeight: 300 }}>
            Today is {today?.label}, {today?.date}
          </div>
          <div className="progress-bar" style={{ marginTop: 11 }}>
            <div className="progress-fill" style={{ width: `${weekPct}%`, background: 'linear-gradient(90deg, rgba(201,168,76,0.5), rgba(201,168,76,0.9))' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            <span style={{ color: 'var(--gold-dim)', fontWeight: 600 }}>{totalDone}</span> of {totalTasks} tasks complete this week
          </div>
        </div>
      </div>

      {/* Coach Card */}
      <div className="coach-card animate-in" style={{ animationDelay: '0.05s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 13 }}>
          <div className="coach-avatar">T</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--gold-dim)' }}>
              Coach Note â {currentStudent.phase}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-hi)', marginTop: 1 }}>Thomas Cordell</div>
          </div>
        </div>
        <div className="coach-note-text" style={{ marginBottom: 15, whiteSpace: 'pre-line' }}>
          {currentStudent.coachNote}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {currentStudent.focusTags?.map(tag => (
            <span key={tag} className="tag tag-gold">{tag}</span>
          ))}
        </div>
      </div>

      {/* Today's Stats */}
      <div className="stat-grid stat-grid-4" style={{ animationDelay: '0.1s' }}>
        <div className="stat-card">
          <div className="stat-card-label">Today</div>
          <div className="stat-card-value" style={{ color: todayPct === 100 ? 'var(--success)' : 'var(--gold)' }}>
            {todayPct}%
          </div>
          <div className="stat-card-sub">{todayDone} of {todayTasks.length} tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Study Time</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>
            {Math.round(todayMins / 60 * 10) / 10}h
          </div>
          <div className="stat-card-sub">{Math.round(todayDoneMins / 60 * 10) / 10}h completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">This Week</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{weekPct}%</div>
          <div className="stat-card-sub">{totalDone}/{totalTasks} tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Overdue</div>
          <div className="stat-card-value" style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {overdueTasks.length}
          </div>
          <div className="stat-card-sub">{overdueTasks.length === 0 ? 'All caught up' : 'from prior days'}</div>
        </div>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="panel" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', animationDelay: '0.12s' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
              <span className="panel-title" style={{ color: 'var(--danger)' }}>Overdue Tasks</span>
            </div>
          </div>
          {overdueTasks.map(task => {
            const cc = TASK_CATEGORIES[task.cat] || TASK_CATEGORIES.Core;
            return (
              <div key={task.id} className="task-item" style={{ marginBottom: 4 }}>
                <div className="task-check" onClick={() => toggleTask(task.id)}>â</div>
                <span className="task-cat" style={{ background: cc.bg, borderColor: cc.border, color: cc.color }}>{task.cat}</span>
                <span className="task-text">{task.text}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{task.dayLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Today's Tasks */}
      <div className="panel animate-in" style={{ animationDelay: '0.15s' }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="panel-title">Today â {today?.label}</span>
            <span className="tag tag-gold">{todayDone}/{todayTasks.length}</span>
          </div>
          <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => navigate('/student/weekly-plan')}>
            Full Plan <ArrowRight size={12} />
          </button>
        </div>

        {today?.time && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, marginBottom: 13 }}>
            <Clock size={13} style={{ color: 'var(--text-lo)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-mid)' }}>{today.time}</div>
              {today.triage && <div style={{ fontSize: 11.5, fontWeight: 300, color: 'var(--text-lo)', marginTop: 3 }}>{today.triage}</div>}
            </div>
          </div>
        )}

        {todayTasks.map(task => {
          const done = !!taskCompletion[task.id];
          const cc = TASK_CATEGORIES[task.cat] || TASK_CATEGORIES.Core;
          return (
            <div key={task.id} className={`task-item ${done ? 'done' : ''}`}>
              <div className="task-check" onClick={() => toggleTask(task.id)}>{done ? 'â' : ''}</div>
              <span className="task-cat" style={{ background: cc.bg, borderColor: cc.border, color: cc.color }}>{task.cat}</span>
              <span className="task-text">{task.text}</span>
              {task.mins > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'monospace' }}>{task.mins}m</span>}
            </div>
          );
        })}

        {today?.tip && (
          <div style={{ padding: '13px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,8,5,0.35)', marginTop: 12, borderRadius: '0 0 12px 12px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 6 }}>
              Thomas's note for {today.label}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-lo)', lineHeight: 1.75, fontWeight: 300 }}>{today.tip}</div>
          </div>
        )}
      </div>
    </div>
  );
}

