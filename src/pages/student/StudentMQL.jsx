import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { ERROR_CATEGORIES, SECTIONS } from '../../data/seedData';

export function StudentMQL() {
  const { mqlErrors, addMqlError } = usePortal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ section: 'Bio', category: '', reasoning: '', pattern: '', intervention: '' });
  const [flash, setFlash] = useState(false);

  const handleSubmit = () => {
    if (!form.category || !form.reasoning) return;
    addMqlError(form);
    setForm({ section: 'Bio', category: '', reasoning: '', pattern: '', intervention: '' });
    setShowForm(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 3000);
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-xl)', padding: '32px 36px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 16 }}>
          Ace The DAT · Missed Question Log
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.5px', marginBottom: 6 }}>
          Missed Question Log
        </div>
        <div style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-lo)', lineHeight: 1.6, marginBottom: 20 }}>
          Every missed question has a reason. Classify it. Fix it. Bring patterns to Saturday.
        </div>

        {/* Error Type Reference */}
        <div className="section-label">Error Type Reference</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(ERROR_CATEGORIES).map(([key, cat]) => (
            <div key={key} style={{ display: 'flex', gap: 11, padding: '11px 13px', borderRadius: 10, background: cat.bg, border: `1px solid ${cat.color}25` }}>
              <div className="error-cat-badge" style={{ background: `${cat.color}50`, color: '#fff' }}>{key}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: `${cat.color}dd`, marginBottom: 2 }}>{key}. {cat.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>{cat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to use */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="panel-title">How to use the MQL</span>
        </div>
        {[
          { n: '01', title: 'Finish the test first — then open the MQL', body: 'Complete the section, then review. Separation helps you see patterns.' },
          { n: '02', title: 'For each missed question — try it again cold', body: "Before looking at any explanation, figure out where your reasoning broke down." },
          { n: '03', title: 'Assign the Error Type honestly', body: "Most students overclassify as Type A when it's actually C or D. Be ruthless." },
          { n: '04', title: "Write the correct reasoning — don't copy the explanation", body: "If you can't explain it without looking, you don't own it yet." },
          { n: '05', title: 'Flag the pattern — this is the most important field', body: "3rd+ time seeing this concept? It's PRIORITY. Bring it to Saturday." },
        ].map(step => (
          <div key={step.n} style={{ display: 'flex', gap: 13, padding: '13px 15px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', marginBottom: 7 }}>
            <div style={{ minWidth: 28, height: 28, borderRadius: 8, background: 'var(--info-bg)', border: '1px solid var(--info-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--info)' }}>{step.n}</span>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-lo)', lineHeight: 1.7, fontWeight: 300 }}>{step.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Log */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="panel-title">Error Log</span>
            <span className="tag tag-muted">{mqlErrors.length} logged</span>
          </div>
          <button className="btn btn-ghost" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Log Error'}
          </button>
        </div>

        {flash && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: 12, marginBottom: 12 }}>
            ✓ Error logged and classified.
          </div>
        )}

        {showForm && (
          <div style={{ padding: 18, borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="form-label">Section</label>
                <select className="form-select" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Error Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select...</option>
                  {Object.entries(ERROR_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{key}. {cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Your reasoning (what you were thinking)</label>
              <textarea className="form-textarea" value={form.reasoning} onChange={e => setForm({ ...form, reasoning: e.target.value })}
                placeholder="What was your thought process when you answered?" rows={2} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="form-label">Pattern (short name)</label>
                <input className="form-input" value={form.pattern} onChange={e => setForm({ ...form, pattern: e.target.value })}
                  placeholder="e.g. Keyword anchor" />
              </div>
              <div>
                <label className="form-label">Fix / Intervention</label>
                <input className="form-input" value={form.intervention} onChange={e => setForm({ ...form, intervention: e.target.value })}
                  placeholder="What to do differently" />
              </div>
            </div>
            <button className="btn btn-gold" onClick={handleSubmit}>Log Error →</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...mqlErrors].reverse().map(err => {
            const cat = ERROR_CATEGORIES[err.category];
            return (
              <div key={err.id} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'start' }}>
                <div className="error-cat-badge" style={{ background: cat?.bg, border: `1px solid ${cat?.color}40`, color: cat?.color }}>
                  {err.category}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span className="tag tag-muted">{err.section}</span>
                    {err.pattern && <span className="tag" style={{ background: cat?.bg, borderColor: `${cat?.color}30`, color: cat?.color }}>{err.pattern}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)', fontStyle: 'italic', marginBottom: 4 }}>"{err.reasoning}"</div>
                  {err.intervention && <div style={{ fontSize: 12, color: 'var(--success)' }}>↳ {err.intervention}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{err.date}</div>
              </div>
            );
          })}
          {mqlErrors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No errors logged yet. After your next practice test, log your misses here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
