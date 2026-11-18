create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_provider text not null default 'anonymous' check (auth_provider in ('anonymous', 'google', 'email', 'apple')),
  email text,
  display_name text,
  morning_nudge_time text not null default '09:00',
  streak_count integer not null default 1 check (streak_count >= 0),
  last_active_day date not null default current_date,
  dumped_today boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users drop constraint if exists users_id_fkey;

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  area text not null default 'personal' check (area in ('work', 'study', 'health', 'personal')),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekdays', 'weekly', 'flexible')),
  streak_count integer not null default 0 check (streak_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  area text not null default 'personal' check (area in ('work', 'study', 'health', 'personal')),
  time text default '',
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  is_important boolean not null default false,
  is_done boolean not null default false,
  is_tomorrow boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  habit_id uuid references public.habits(id) on delete set null,
  goal_id uuid
);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_user_day on public.tasks(user_id, is_tomorrow, is_done);
create index if not exists idx_habits_user_id on public.habits(user_id);

alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;

drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile"
  on public.users for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
  on public.users for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
  on public.users for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
  on public.tasks for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
  on public.tasks for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
  on public.tasks for delete
  to anon, authenticated
  using (true);

drop policy if exists "Users can view their own habits" on public.habits;
create policy "Users can view their own habits"
  on public.habits for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can insert their own habits" on public.habits;
create policy "Users can insert their own habits"
  on public.habits for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Users can update their own habits" on public.habits;
create policy "Users can update their own habits"
  on public.habits for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Users can delete their own habits" on public.habits;
create policy "Users can delete their own habits"
  on public.habits for delete
  to anon, authenticated
  using (true);

create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_provider text;
  v_name text;
begin
  if new.is_anonymous is true then
    v_provider := 'anonymous';
  else
    v_provider := coalesce(new.raw_app_meta_data->>'provider', 'email');
  end if;

  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Zonak Friend'
  );

  insert into public.users (id, auth_provider, email, display_name, last_active_day, streak_count)
  values (new.id, v_provider, new.email, v_name, current_date, 1)
  on conflict (id) do update
  set
    auth_provider = excluded.auth_provider,
    email = coalesce(excluded.email, public.users.email),
    display_name = coalesce(excluded.display_name, public.users.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_or_updated on auth.users;
create trigger on_auth_user_created_or_updated
  after insert or update on auth.users
  for each row execute procedure public.handle_auth_user_sync();
