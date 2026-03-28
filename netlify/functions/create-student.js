/**
 * Netlify Function: create-student
 *
 * Creates a new student:
 * 1. Inserts a row into public.students
 * 2. Creates a Supabase auth user via Admin API (email_confirm: true — NO email sent)
 * 3. Creates a public.profiles row linking auth user ↔ student
 * 4. Returns the temporary password to the coach
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify env vars.
 * (Service role key bypasses RLS and can create auth users.)
 */

const { createClient } = require('@supabase/supabase-js');

// Generate a human-readable temp password
function generateTempPassword(name) {
  const part1 = name.split(' ')[0] || 'AceDAT';
  const part2 = Math.floor(1000 + Math.random() * 9000); // 4 digit number
  const part3 = ['!', '@', '#', '$', '%'][Math.floor(Math.random() * 5)];
  return `${part1}${part2}${part3}`;
}

// Generate initials from full name
function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// Generate a student color
const COLORS = ['#C9A84C', '#6366f1', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
function pickColor(name) {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { name, email, phone, testDate, targetAA, program, weakAreas, coachId, sections } = body;

  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'name and email are required' }) };
  }

  // Service role client (bypasses RLS, can create auth users)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const tempPassword = generateTempPassword(name);
  const initials     = getInitials(name);
  const color        = pickColor(name);

  try {
    // Step 1: Insert student record
    const { data: studentRow, error: studentErr } = await supabaseAdmin
      .from('students')
      .insert({
        name,
        email,
        phone:      phone || '',
        test_date:  testDate || null,
        target_aa:  targetAA || 22,
        program:    program || 'Full DAT',
        phase:      'Foundation',
        sections:   sections || {},
        weak_areas: weakAreas || [],
        focus_tags: [],
        coach_note: '',
        coach_id:   coachId || null,
        color,
        initials,
      })
      .select()
      .single();

    if (studentErr) {
      console.error('[create-student] Student insert error:', studentErr);
      return { statusCode: 500, body: JSON.stringify({ error: studentErr.message }) };
    }

    // Step 2: Create auth user — email_confirm:true prevents any email
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password:      tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role:       'student',
        student_id: studentRow.id,
      },
    });

    if (authErr) {
      // Rollback student row
      await supabaseAdmin.from('students').delete().eq('id', studentRow.id);
      console.error('[create-student] Auth create error:', authErr);
      return { statusCode: 500, body: JSON.stringify({ error: authErr.message }) };
    }

    // Step 3: Create profile row
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .insert({
        id:         authData.user.id,
        role:       'student',
        name,
        student_id: studentRow.id,
        home_path:  '/student/dashboard',
        label:      `${name} Portal`,
      });

    if (profileErr) {
      console.error('[create-student] Profile insert error:', profileErr);
      // Still return success with password
    }

    // Return success
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success:      true,
        tempPassword,
        student: {
          id:       studentRow.id,
          name:     studentRow.name,
          email:    studentRow.email,
          initials: studentRow.initials,
          color:    studentRow.color,
        },
      }),
    };

  } catch (err) {
    console.error('[create-student] Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
