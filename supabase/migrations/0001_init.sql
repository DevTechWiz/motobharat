-- MotoBharat — Migration 001: full schema + RLS
-- Tables: profiles, events, event_members, gallery, announcements

-- ── Enums ──────────────────────────────────────────────

create type user_role as enum ('rider', 'admin');
create type evt_status as enum ('draft', 'published', 'completed', 'cancelled');
create type ride_difficulty as enum ('easy', 'moderate', 'hard');

-- ── profiles ───────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) <= 50),
  avatar_url text,
  city text,
  role user_role not null default 'rider',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Rider'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── events ─────────────────────────────────────────────

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null check (char_length(title) <= 100),
  description text not null default '' check (char_length(description) <= 2000),
  starts_at timestamptz not null,
  meeting_point text not null default '',
  distance_km numeric,
  difficulty ride_difficulty,
  cover_url text,
  status evt_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index events_status_idx on public.events (status);
create index events_starts_at_idx on public.events (starts_at);

alter table public.events enable row level security;

create policy "Published events are viewable by everyone"
  on public.events for select
  using (status = 'published' or auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can insert events"
  on public.events for insert
  with check (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can update events"
  on public.events for update
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can delete events"
  on public.events for delete
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

-- ── event_members ──────────────────────────────────────

create table public.event_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_members_user_idx on public.event_members (user_id);

alter table public.event_members enable row level security;

create policy "Members are viewable by everyone"
  on public.event_members for select using (true);

create policy "Users can join rides"
  on public.event_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave rides"
  on public.event_members for delete
  using (auth.uid() = user_id);

create policy "Admins can remove members"
  on public.event_members for delete
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

-- ── gallery ────────────────────────────────────────────

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  url text not null unique,
  thumb_url text not null,
  -- TODO(R2): re-enable when the R2 pipeline is live and backfill from url.
  -- r2_key text unique,
  mime text not null check (mime in ('image/jpeg', 'image/webp')),
  width int,
  height int,
  alt text not null default '',
  created_at timestamptz not null default now()
);

create index gallery_event_idx on public.gallery (event_id);

alter table public.gallery enable row level security;

create policy "Gallery is viewable by everyone"
  on public.gallery for select using (true);

create policy "Admins can insert gallery"
  on public.gallery for insert
  with check (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can delete gallery"
  on public.gallery for delete
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

-- ── announcements ──────────────────────────────────────

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null check (char_length(title) <= 100),
  body text not null default '' check (char_length(body) <= 2000),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index announcements_created_at_idx on public.announcements (created_at desc);

alter table public.announcements enable row level security;

create policy "Announcements are viewable by everyone"
  on public.announcements for select using (true);

create policy "Admins can insert announcements"
  on public.announcements for insert
  with check (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can update announcements"
  on public.announcements for update
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can delete announcements"
  on public.announcements for delete
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));
