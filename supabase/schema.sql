-- ═══════════════════════════════════════════════════════
-- ACE THE DAT PORTAL — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- ── 1. STUDENTS ──────────────────────────────────────────
create table if not exists public.students (
  id                  text primary key,
  name                text not null,
  email               text,
  initials            text,
  color               text,
  status              text not null default 'Active',
  program             text,
  test_date           text,
  target_aa           integer default 400,
  target_sections     jsonb default '{}'::jsonb,
  sections            jsonb default '{}'::jsonb,
  weekly_study_hours  integer default 20,
  constraints         text,
  session_cadence     text default 'Weekly',
  predicted           integer,
  coach               text,
  avatar              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── 2. PROFILES (extends auth.users) ─────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        text not null check (role in ('coach', 'student')),
  name        text not null,
  student_id  text references public.students(id) on delete set null,
  home_path   text not null default '/coach/dashboard',
  created_at  timestamptz not null default now()
);

-- ── 3. MQL ERRORS ────────────────────────────────────────
create table if not exists public.mql_errors (
  id                    text primary key,
  student_id            text not null references public.students(id) on delete cascade,
  section               text not null default '',
  subtopic              text default '',
  source                text default '',
  exam_number           text default '',
  question_number       text default '',
  error_type            text default '',
  confidence_before     integer default 0,
  why_missed            text default '',
  takeaway              text default '',
  reviewed              boolean default false,
  still_weak            boolean default false,
  include_in_next_plan  boolean default false,
  date                  date not null default current_date,
  created_at            timestamptz not null default now()
);

-- ── 4. CHECK-INS ─────────────────────────────────────────
create table if not exists public.check_ins (
  id            uuid default gen_random_uuid() primary key,
  student_id    text not null references public.students(id) on delete cascade,
  week_id       text not null,
  data          jsonb default '{}'::jsonb,
  submitted_at  timestamptz not null default now(),
  unique(student_id, week_id)
);

-- ── 5. WEEKLY PLANS ──────────────────────────────────────
create table if not exists public.weekly_plans (
  id           uuid default gen_random_uuid() primary key,
  student_id   text not null references public.students(id) on delete cascade,
  week_of      text,
  week_number  integer default 1,
  notes        text,
  blocks       jsonb default '[]'::jsonb,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── 6. TASK COMPLETIONS ───────────────────────────────────
create table if not exists public.task_completions (
  id          uuid default gen_random_uuid() primary key,
  student_id  text not null references public.students(id) on delete cascade,
  task_id     text not null,
  completed   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique(student_id, task_id)
);

-- ── 7. STUDENT NOTES ─────────────────────────────────────
create table if not exists public.student_notes (
  id          uuid default gen_random_uuid() primary key,
  student_id  text not null references public.students(id) on delete cascade,
  day_id      text not null,
  content     text,
  updated_at  timestamptz not null default now(),
  unique(student_id, day_id)
);

-- ── 8. INSIGHTS ──────────────────────────────────────────
create table if not exists public.insights (
  id          text primary key,
  student_id  text references public.students(id) on delete set null,
  content     text,
  type        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════
alter table public.students        enable row level security;
alter table public.profiles        enable row level security;
alter table public.mql_errors      enable row level security;
alter table public.check_ins       enable row level security;
alter table public.weekly_plans    enable row level security;
alter table public.task_completions enable row level security;
alter table public.student_notes   enable row level security;
alter table public.insights        enable row level security;

-- Allow all authenticated users full access (tighten per-student later)
create policy "auth_all" on public.students        for all to authenticated using (true) with check (true);
create policy "auth_all" on public.profiles        for all to authenticated using (true) with check (true);
create policy "auth_all" on public.mql_errors      for all to authenticated using (true) with check (true);
create policy "auth_all" on public.check_ins       for all to authenticated using (true) with check (true);
create policy "auth_all" on public.weekly_plans    for all to authenticated using (true) with check (true);
create policy "auth_all" on public.task_completions for all to authenticated using (true) with check (true);
create policy "auth_all" on public.student_notes   for all to authenticated using (true) with check (true);
create policy "auth_all" on public.insights        for all to authenticated using (true) with check (true);

-- ═══════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP
-- Trigger: when a new auth user is created, insert their profile
-- You must set user_metadata: { role, name, student_id, home_path }
-- ═══════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, name, student_id, home_path)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'student_id',
    coalesce(new.raw_user_meta_data->>'home_path', '/student/dashboard')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
