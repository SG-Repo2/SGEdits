/**
 * Netlify Function: create-student
 * Uses coach JWT for DB inserts (RLS-safe). Service role only for admin.createUser.
 * Frontend MUST send: Authorization: Bearer <coach_access_token>
 *
 * Required Netlify env vars:
 *   SUPABASE_URL              - project URL
 *   SUPABASE_ANON_KEY         - anon/public key (or VITE_SUPABASE_ANON_KEY)
 *   SUPABASE_SERVICE_ROLE_KEY - service role key (for auth user creation)
 */

import { createClient } from '@supabase/supabase-js';

function generateTempPassword(name) {
    const part1 = name.split(' ')[0] || 'AceDAT';
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const part3 = ['!', '@', '#', '$', '%'][Math.floor(Math.random() * 5)];
    return `${part1}${part2}${part3}`;
}
function getInitials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
const COLORS = ['#C9A84C', '#6366f1', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
function pickColor(name) { return COLORS[name.charCodeAt(0) % COLORS.length]; }

export const handler = async function (event) {
    if (event.httpMethod !== 'POST') {
          return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const ANON_KEY     = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    console.log('[create-student] URL:', SUPABASE_URL.slice(0, 40));
    console.log('[create-student] ANON len:', ANON_KEY.length, 'prefix:', ANON_KEY.slice(0, 15));
    console.log('[create-student] SVC len:', SERVICE_KEY.length, 'prefix:', SERVICE_KEY.slice(0, 15));

    if (!SUPABASE_URL || !ANON_KEY) {
          return { statusCode: 500, body: JSON.stringify({
                  error: 'Missing Supabase config', diag: { url: !!SUPABASE_URL, anon: !!ANON_KEY }
          })};
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { name, email, phone, testDate, targetAA, program, weakAreas, coachId, sections } = body;
    if (!name || !email) {
          return { statusCode: 400, body: JSON.stringify({ error: 'name and email are required' }) };
    }

    // Coach JWT client - uses coach's session so RLS allows inserts
    const coachToken = (event.headers?.authorization || event.headers?.Authorization || '')
      .replace(/^Bearer\s+/i, '');

    const supabaseCoach = createClient(SUPABASE_URL, ANON_KEY, {
          global: { headers: coachToken ? { Authorization: `Bearer ${coachToken}` } : {} },
          auth: { persistSession: false, autoRefreshToken: false },
    });

    // Admin client - only for auth.admin.createUser (needs service role key)
    const supabaseAdmin = SERVICE_KEY
      ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
          : null;

    const tempPassword = generateTempPassword(name);
    const initials     = getInitials(name);
    const color        = pickColor(name);

    try {
          // Step 1: Insert student record using coach JWT (respects RLS)
      const { data: studentRow, error: studentErr } = await supabaseCoach
            .from('students')
            .insert({
                      name, email, phone: phone || '', test_date: testDate || null,
                      target_aa: targetAA || 22, program: program || 'Full DAT', phase: 'Foundation',
                      sections: sections || {}, weak_areas: weakAreas || [], focus_tags: [],
                      coach_note: '', coach_id: coachId || null, color, initials,
            })
            .select().single();

      if (studentErr) {
              console.error('[create-student] Student insert error:', JSON.stringify(studentErr));
              return { statusCode: 500, body: JSON.stringify({
                        error: studentErr.message,
                        detail: studentErr.details || studentErr.hint || '',
                        diag: { url: SUPABASE_URL.slice(0, 40), anon_len: ANON_KEY.length, svc_len: SERVICE_KEY.length, has_token: !!coachToken },
              })};
      }

      // Step 2: Create auth user with service role (optional - gracefully skipped if key is bad)
      let authUserId = null;
          let authUserCreated = false;

      if (supabaseAdmin) {
              const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                        email, password: tempPassword, email_confirm: true,
                        user_metadata: { name, role: 'student', student_id: studentRow.id },
              });
              if (authErr) {
                        console.error('[create-student] Auth create error:', JSON.stringify(authErr));
              } else {
                        authUserId = authData.user.id;
                        authUserCreated = true;
                        // Step 3: Create profile row
                const { error: profileErr } = await supabaseCoach.from('profiles').insert({
                            id: authUserId, role: 'student', name, student_id: studentRow.id,
                            home_path: '/student/dashboard', label: `${name} Portal`,
                });
                        if (profileErr) console.error('[create-student] Profile error:', JSON.stringify(profileErr));
              }
      } else {
              console.warn('[create-student] No service key - skipping auth user creation');
      }

      return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                        success: true,
                        tempPassword: authUserCreated ? tempPassword : null,
                        authUserCreated,
                        student: { id: studentRow.id, name: studentRow.name, email: studentRow.email,
                                            initials: studentRow.initials, color: studentRow.color },
              }),
      };

    } catch (err) {
          console.error('[create-student] Unexpected error:', err);
          return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal server error' }) };
    }
};
