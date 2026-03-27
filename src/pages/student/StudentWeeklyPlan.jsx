import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { TASK_CATEGORIES } from '../../data/seedData';
import { Clock } from 'lucide-react';

export function StudentWeeklyPlan() {
  const { weeklyPlan, taskCompletion, toggleTask, notes, saveNote } = usePortal();
  const todayIdx = weeklyPlan?.days?.findIndex(d => d.isToday) ?? 0;
  const [activeDay, setActiveDay] = useState(todayIdx >= 0 ? todayIdx : 0);

  if (!weeklyPlan) return <div style={{ color: 'var(--text-lo)', padding: 40 }}>No weekly plan assigned.</div>;

  const day = weeklyPlan.days[activeDay];
  const dayDone = day.tasks.filter(t => taskCompletion[t.id]).length;
  const dayTotal = day.tasks.length;
  const dayPct = dayTotal > 0 ? Math.round(dayDone / dayTotal * 100) : 0;
  const dayMins = day.tasks.reduce((a, t) => a + (t.mins || 0), 0);

  return (
    <div className="animate-in">
      <div className="section-header">
        <div className="section-header-title">Weekly Plan</div>
        <div className="section-header-sub">{weeklyPlan.weekLabel}</div>
      </div>

      {/* Day Selector */}
      <div className="day-selector">
        {weeklyPlan.days.map((d, i) => {
          const done = d.tasks.filter(t => taskCompletion[t.id]).length;
          const total = d.tasks.length;
          const pct = total > 0 ? Math.round(done / total * 100) : 0;
          const allDone = total > 0 && done === total;
          const fillCol = allDone ? 'var(--success)' : d.color;
          return (
            <button
              key={d.id}
              className={`day-btn ${i === activeDay ? 'active' : ''} ${d.isToday ? 'today' : ''}`}
              onClick={() => setActiveDay(i)}
            >
              <div className="day-btn-label">{d.short}</div>
              <div className="day-btn-name">{d.label.substring(0, 3)}</div>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: fillCol }} />
              </div>
              <div className="day-btn-count">{done}/{total}</div>
            </button>
          );
        })}
      </div>

      {/* Day Card */}
      <div className="day-card" style={{ borderColor: day.isSession ? 'rgba(147,112,219,0.28)' : day.isToday ? 'var(--gold-border)' : 'var(--border)' }}>
        <div className="day-card-header" style={{ background: day.bg }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="day-card-title" style={{ color: day.color }}>{day.label}</span>
              <span className="tag" style={{ background: day.color, color: 'rgba(8,20,12,0.85)', borderColor: 'transparent', fontSize: 9 }}>
                {day.isSession ? 'Session Day' : dayTotal === 0 ? 'Rest' : 'Study'}
              </span>
              {day.isToday && <span className="tag tag-gold">Today</span>}
            </div>
            <div className="day-card-sub">{dayTotal} tasks · ~{Math.round(dayMins / 60 * 10) / 10}h</div>
          </div>
          <div>
            <div className="day-card-pct" style={{ color: dayPct === 100 ? 'var(--success)' : day.color }}>
              {dayPct === 100 ? '✓' : `${dayPct}%`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>{dayDone} of {dayTotal}</div>
          </div>
        </div>

        <div className="progress-bar" style={{ height: 3, borderRadius: 0 }}>
          <div className="progress-fill" style={{ width: `${dayPct}%`, background: dayPct === 100 ? 'var(--success)' : day.color }} />
        </div>

        <div className="day-card-body">
          {/* Time budget */}
          {day.time && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, marginBottom: 13 }}>
              <Clock size={13} style={{ color: 'var(--text-lo)', marginTop: 1, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-mid)' }}>{day.time}</div>
                {day.triage && <div style={{ fontSize: 11.5, fontWeight: 300, color: 'var(--text-lo)', marginTop: 3, lineHeight: 1.5 }}>{day.triage}</div>}
              </div>
            </div>
          )}

          {/* Tasks */}
          {dayTotal === 0 ? (
            <div style={{ padding: '14px 0' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontStyle: 'italic', color: 'var(--text-muted)' }}>"Rest is part of the training."</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginTop: 8 }}>Light review only if you feel drawn to it. Mental recovery is the goal.</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 11 }}>Checklist</div>
              {day.tasks.map(task => {
                const done = !!taskCompletion[task.id];
                const cc = TASK_CATEGORIES[task.cat] || TASK_CATEGORIES.Core;
                return (
                  <div key={task.id} className={`task-item ${done ? 'done' : ''}`}>
                    <div className="task-check" onClick={() => toggleTask(task.id)}>{done ? '✓' : ''}</div>
                    <span className="task-cat" style={{ background: cc.bg, borderColor: cc.border, color: cc.color }}>{task.cat}</span>
                    <span className="task-text">{task.text}</span>
                    {task.mins > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'monospace' }}>{task.mins}m</span>}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Coach tip */}
        {day.tip && (
          <div style={{ padding: '13px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,8,5,0.35)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 6 }}>
              Thomas's note for {day.label}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-lo)', lineHeight: 1.75, fontWeight: 300 }}>{day.tip}</div>
          </div>
        )}

        {/* Student notes */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 7 }}>
            Your notes — {day.label}
          </div>
          <textarea
            className="form-textarea"
            placeholder="What happened today? What patterns did you notice?"
            value={notes[day.id] || ''}
            onChange={(e) => saveNote(day.id, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
