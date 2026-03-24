export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__hero">
        <p className="auth-layout__eyebrow">AceTheDAT Portal</p>
        <h1>Local-first coaching operations, ready for real data later.</h1>
        <p>
          This scaffold keeps today&apos;s seeded workflow intact while separating routing, state, seed data, and repository
          access for a clean future Supabase migration.
        </p>
      </div>
      <div className="auth-layout__panel">{children}</div>
    </div>
  );
}
