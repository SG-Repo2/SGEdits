import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { sectionFrameworks } from '../../data/seedData';
import { ChevronDown } from 'lucide-react';

function SectionCard({ name, data }) {
  const [open, setOpen] = useState(!!data.open);

  return (
    <div className={`sec-card ${open ? 'open' : ''}`} style={{ borderColor: `${data.badgeColor}30` }}>
      <div className="sec-card-header" onClick={() => setOpen(!open)} style={{ background: `${data.badgeColor}08` }}>
        <div style={{ flex: 1 }}>
          <span className="tag" style={{ background: `${data.badgeColor}16`, borderColor: `${data.badgeColor}30`, color: data.badgeColor, marginBottom: 6 }}>
            {data.badge}
          </span>
          <div className="sec-card-name">{name}</div>
          <div className="sec-card-tagline">{data.tagline}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span className="tag" style={{ background: `${data.statusColor}10`, borderColor: `${data.statusColor}25`, color: data.statusColor }}>
            {data.status}
          </span>
          <ChevronDown size={16} style={{ color: 'var(--text-lo)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </div>
      </div>
      <div className="sec-card-body">
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 7 }}>
          Where you are right now
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 300, color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {data.where}
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 9 }}>
          This week's approach
        </div>
        <div style={{ marginBottom: 14 }}>
          {data.approach.map((pt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 8, fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.65, fontWeight: 300 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: `${pt.color}99` }} />
              <span dangerouslySetInnerHTML={{ __html: pt.text.replace(/^([^—]+—)/, '<strong style="color:var(--text-hi);font-weight:600">$1</strong>') }} />
            </div>
          ))}
        </div>
        {data.watch && (
          <div style={{ display: 'flex', gap: 9, padding: '11px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 12.5, color: 'var(--text-lo)', lineHeight: 1.7, fontWeight: 300 }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚑</span>
            <span><strong style={{ color: 'var(--text-mid)', fontWeight: 600 }}>Watch for:</strong> {data.watch}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentSections() {
  return (
    <div className="animate-in">
      <div className="section-header">
        <div className="section-header-title">My Sections</div>
        <div className="section-header-sub">Where you stand in each section and how to approach it this week.</div>
      </div>
      {Object.entries(sectionFrameworks).map(([name, data]) => (
        <SectionCard key={name} name={name === 'OChem' ? 'Organic Chemistry' : name === 'GChem' ? 'General Chemistry' : name === 'QR' ? 'Quantitative Reasoning' : name === 'RC' ? 'Reading Comprehension' : name === 'PAT' ? 'Perceptual Ability' : name} data={data} />
      ))}
    </div>
  );
}
