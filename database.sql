-- Supabase Schema for Academi

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text,
  username text,
  major text,
  points integer default 0,
  level_name text default 'Bronze',
  streak integer default 0,
  preferred_study_start_hour integer default 9,
  preferred_study_end_hour integer default 17,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles sync trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Courses
create table public.courses (
  id serial primary key,
  user_id uuid references public.users on delete cascade not null,
  code text not null,
  name text not null,
  description text,
  credits integer,
  semester text,
  syllabus_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks
create table public.tasks (
  id serial primary key,
  user_id uuid references public.users on delete cascade not null,
  course_id integer references public.courses on delete cascade,
  title text not null,
  description text,
  type text not null,
  status text default 'pending',
  deadline timestamp with time zone,
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  estimated_duration_mins integer default 30,
  points_value integer default 10,
  priority_score numeric(4,3) default 0.5,
  reschedule_count integer default 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedule
create table public.schedules (
  id serial primary key,
  user_id uuid references public.users on delete cascade not null,
  task_id integer references public.tasks on delete cascade,
  date timestamp with time zone not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'scheduled',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mood Entries
create table public.mood_entries (
  id serial primary key,
  user_id uuid references public.users on delete cascade not null,
  mood_level integer not null,
  energy_level integer not null,
  notes text,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications
create table public.notifications (
  id serial primary key,
  user_id uuid references public.users on delete cascade not null,
  task_id integer references public.tasks on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study Paths (AI)
create table public.study_paths (
  id serial primary key,
  user_id uuid references public.users on delete cascade not null,
  course_id integer references public.courses on delete cascade,
  generated_path text not null,
  model_used text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Course Materials
create table public.course_materials (
  id serial primary key,
  user_id uuid references public.users on delete cascade not null,
  course_id integer references public.courses on delete cascade not null,
  title text not null,
  extracted_text text,
  generated_notes text,
  study_plan jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.schedules enable row level security;
alter table public.mood_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.study_paths enable row level security;
alter table public.course_materials enable row level security;

-- Policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Users can CRUD own courses" on public.courses for all using (auth.uid() = user_id);
create policy "Users can CRUD own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users can CRUD own schedules" on public.schedules for all using (auth.uid() = user_id);
create policy "Users can CRUD own mood entries" on public.mood_entries for all using (auth.uid() = user_id);
create policy "Users can CRUD own notifications" on public.notifications for all using (auth.uid() = user_id);
create policy "Users can CRUD own study paths" on public.study_paths for all using (auth.uid() = user_id);
create policy "Users can CRUD own course materials" on public.course_materials for all using (auth.uid() = user_id);

-- RPC for incrementing points securely
create or replace function public.increment_points(user_id uuid, amount integer)
returns void as $$
begin
  update public.users
  set points = points + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Enable realtime
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notifications;
