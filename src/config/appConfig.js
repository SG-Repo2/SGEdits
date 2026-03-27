const dataSource = (import.meta.env.VITE_PORTAL_DATA_SOURCE || 'demo').toLowerCase();

export const appConfig = {
  name: 'AceTheDAT Portal',
  shortName: 'AceTheDAT',
  supportEmail: 'portal@acethedat.com',
  dataSource,
  isDemoMode: dataSource !== 'supabase',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};
