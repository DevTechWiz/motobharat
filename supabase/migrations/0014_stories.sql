-- MotoBharat — Migration 014: Rider Stories & Achievements
-- Allows admins to publish rider spotlights, long-distance touring articles,
-- and club milestone achievements with cover photo, gallery, and metrics.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null check (char_length(title) <= 200),
  subtitle text check (subtitle is null or char_length(subtitle) <= 300),
  category text not null default 'achievement',
  cover_url text not null,
  content text not null default '',
  rider_name text,
  rider_bike text,
  rider_id uuid references public.profiles(id) on delete set null,
  author text not null default 'Team Moto Bharat',
  tags text[] default '{}'::text[],
  stats jsonb default '[]'::jsonb,
  photos jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stories_created_at_idx on public.stories (created_at desc);
create index if not exists stories_slug_idx on public.stories (slug);

alter table public.stories enable row level security;

create policy "Stories are viewable by everyone"
  on public.stories for select using (true);

create policy "Admins can insert stories"
  on public.stories for insert
  with check (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can update stories"
  on public.stories for update
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Admins can delete stories"
  on public.stories for delete
  using (auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));
