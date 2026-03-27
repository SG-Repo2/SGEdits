import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';

export function CoachScheduleBuilder() {
  const { students } = usePortal() || {};
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary, #f1f5f9)' }}>
        Schedule Builder
      </h1>
      <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '2rem' }}>
        Build custom study schedules for your students.
      </p>
      {students && students.length > 0 && (
        <select
          value={selectedStudent || ''}
          onChange={e => setSelectedStudent(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--surface-2, #1e293b)', color: 'var(--text-primary, #f1f5f9)', border: '1px solid var(--border, #334155)' }}
        >
          <option value="">Select a student...</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export default CoachScheduleBuilder;
