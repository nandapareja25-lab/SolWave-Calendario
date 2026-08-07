-- Run this in your Supabase SQL editor before deploying the app

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  genre text not null,
  concept text not null default '',
  main_emotion text not null default '',
  target_audience text not null default '',
  color text not null default '#E0E0E0',
  total_songs int not null default 0,
  album_launch_date date,
  album_scheduled boolean not null default false,
  album_published boolean not null default false,
  youtube_url text,
  launch_notes text,
  created_at timestamptz not null default now()
);

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  name text not null,
  track_number int,
  genre text not null default '',
  approximate_duration text,
  priority text check (priority in ('normal', 'high')) default 'normal',
  notes text,
  scheduled_date date,
  scheduled_time time,
  created_at timestamptz not null default now()
);

create table if not exists checklist_steps (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  step_key text not null check (step_key in (
    'audio_done', 'thumbnail_created', 'video_rendered', 'title_ready',
    'description_ready', 'hashtags_ready', 'uploaded_to_youtube', 'scheduled',
    'published', 'added_to_playlist', 'end_screens_configured', 'cards_configured',
    'pinned_comment', 'shared_on_social'
  )),
  completed boolean not null default false,
  completed_at timestamptz,
  unique(song_id, step_key)
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null
);

insert into app_settings (key, value) values ('allow_catchup_days', 'false') on conflict do nothing;

-- Indexes for performance
create index if not exists idx_songs_album_id on songs(album_id);
create index if not exists idx_songs_scheduled_date on songs(scheduled_date);
create index if not exists idx_checklist_song_id on checklist_steps(song_id);

-- Disable RLS for single-user app (protected by app-level password)
alter table albums disable row level security;
alter table songs disable row level security;
alter table checklist_steps disable row level security;
alter table app_settings disable row level security;
