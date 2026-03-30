import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';

export function StudentWeeklyPlan() {
  const { currentStudent, weeklyPlan, taskCompletion, toggleTask, notes, saveNote } = usePortal();
  const todayIndex = weeklyPlan?.days?.findIndex((day) => day.isToday) ?? 0;
  const [activeDayIndex, setActiveDayIndex] = useState(todayIndex >= 0 ? todayIndex : 0);

  if (!currentStudent || !weeklyPlan) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>No weekly plan assigned yet.</div>;
  }

  const activeDay = weeklyPlan.days[activeDayIndex] || weeklyPlan.days[0];
  if (!activeDay) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>No weekly plan assigned yet.</div>;
  }

  const completedCount = activeDay.tasks.filter((task) => taskCompletion[`${currentStudent.id}:${task.id}`]).length;

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <div className="section-header-title">Weekly Plan</div>
          <div className="section-header-sub">{weeklyPlan.weekLabel}</div>
        </div>
        <span className={`tag ${weeklyPlan.status === 'published' ? 'tag-success' : 'tag-gold'}`}>
          {weeklyPlan.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, marginBottom: 18 }}>
        {weeklyPlan.days.map((day, index) => {
          const done = day.tasks.filter((task) => taskCompletion[`${currentStudent.id}:${task.id}`]).length;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setActiveDayIndex(index)}
              style={{
                padding: '12px 10px',
                borderRadius: 14,
                border: `1px solid ${index === activeDayIndex ? day.color : 'var(--border)'}`,
                background: index === activeDayIndex ? day.bg : 'var(--bg-panel)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: index === activeDayIndex ? day.color : 'var(--text-hi)' }}>
                {day.short}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {done}/{day.tasks.length}
              </div>
            </button>
          );
        })}
      </div>

      <div className="panel">
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
          background: activeDay.bg,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
        }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: activeDay.color }}>{activeDay.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>
              {completedCount}/{activeDay.tasks.length} tasks complete
            </div>
          </div>
          {activeDay.isToday && <span className="tag tag-gold">Today</span>}
        </div>

        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          {activeDay.tasks.length > 0 ? activeDay.tasks.map((task) => {
            const done = !!taskCompletion[`${currentStudent.id}:${task.id}`];
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-panel-hover)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  opacity: done ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-hi)', textDecoration: done ? 'line-through' : 'none' }}>
                    {task.text}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {task.minutes ?? task.mins ?? 0} min
                  </span>
                </div>
              </button>
            );
          }) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No tasks assigned for this day.
            </div>
          )}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <label className="form-label">Your notes for {activeDay.label}</label>
          <textarea
            className="form-textarea"
            value={notes[`${currentStudent.id}:${activeDay.id}`] || ''}
            onChange={(event) => saveNote(activeDay.id, event.target.value)}
            placeholder="Add anything your coach should know about this day."
          />
        </div>
      </div>
    </div>
  );
}
