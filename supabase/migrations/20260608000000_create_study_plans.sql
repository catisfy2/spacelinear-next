-- ============================================================================
-- SpaceLinear — Create study_plans table for AI-generated study plans
-- ============================================================================

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  prompt text,
  description text,
  plan_data jsonb,
  status text not null default 'generating'
    check (status in ('generating', 'review', 'applied', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.study_plans enable row level security;

-- RLS: users can only see their own plans
create policy "Users can view own plans"
  on public.study_plans for select
  using (auth.uid() = user_id);

-- RLS: users can insert their own plans
create policy "Users can create own plans"
  on public.study_plans for insert
  with check (auth.uid() = user_id);

-- RLS: users can update their own plans
create policy "Users can update own plans"
  on public.study_plans for update
  using (auth.uid() = user_id);

-- RLS: users can delete their own plans
create policy "Users can delete own plans"
  on public.study_plans for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index if not exists idx_study_plans_user_id
  on public.study_plans(user_id);

create index if not exists idx_study_plans_status
  on public.study_plans(status);
