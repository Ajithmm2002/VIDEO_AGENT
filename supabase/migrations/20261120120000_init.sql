-- Content Studio schema. Run this whole file in the Supabase SQL editor.
-- Safe to run again if a previous attempt failed.
-- Passwords stay in Supabase Auth. This app never stores them.

do $$ begin
  create type public.content_platform as enum ('youtube', 'instagram', 'both');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_language as enum ('ml', 'en');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_status as enum (
    'idea',
    'planning',
    'in_progress',
    'ready',
    'scheduled',
    'published'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  )
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(name) between 1 and 60),
  constraint categories_color_hex check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint categories_user_name_unique unique (user_id, name)
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  topic text,
  platform public.content_platform not null default 'both',
  language public.content_language not null default 'en',
  description text,
  youtube_description text,
  instagram_caption text,
  tags text[] not null default '{}',
  hashtags text[] not null default '{}',
  script_notes text,
  thumbnail_prompt text,
  video_url text,
  published_url text,
  thumbnail_path text,
  planned_date date,
  status public.content_status not null default 'idea',
  views integer,
  likes integer,
  comments integer,
  notes text,
  reference_links jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contents_title_length check (char_length(title) between 1 and 200),
  constraint contents_topic_length check (topic is null or char_length(topic) between 1 and 500),
  constraint contents_description_length check (description is null or char_length(description) <= 8000),
  constraint contents_youtube_length check (youtube_description is null or char_length(youtube_description) <= 8000),
  constraint contents_caption_length check (instagram_caption is null or char_length(instagram_caption) <= 5000),
  constraint contents_script_length check (script_notes is null or char_length(script_notes) <= 20000),
  constraint contents_prompt_length check (thumbnail_prompt is null or char_length(thumbnail_prompt) <= 20000),
  constraint contents_notes_length check (notes is null or char_length(notes) <= 8000),
  constraint contents_video_url_https check (video_url is null or (video_url ~ '^https://[^[:space:]]+$' and char_length(video_url) <= 2008)),
  constraint contents_published_url_https check (published_url is null or (published_url ~ '^https://[^[:space:]]+$' and char_length(published_url) <= 2008)),
  constraint contents_tags_bounds check (cardinality(tags) <= 40),
  constraint contents_hashtags_bounds check (cardinality(hashtags) <= 40),
  constraint contents_reference_links_size check (jsonb_array_length(reference_links) <= 30),
  constraint contents_checklist_size check (jsonb_array_length(checklist) <= 30),
  constraint contents_views_nonnegative check (views is null or views >= 0),
  constraint contents_likes_nonnegative check (likes is null or likes >= 0),
  constraint contents_comments_nonnegative check (comments is null or comments >= 0),
  constraint contents_reference_links_array check (jsonb_typeof(reference_links) = 'array'),
  constraint contents_checklist_array check (jsonb_typeof(checklist) = 'array')
);

create table if not exists public.thumbnail_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id uuid references public.contents (id) on delete set null,
  topic text not null,
  language public.content_language not null,
  landscape_prompt text not null,
  vertical_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint thumbnail_prompts_topic_length check (char_length(topic) between 1 and 500),
  constraint thumbnail_prompts_landscape_length check (char_length(landscape_prompt) between 1 and 20000),
  constraint thumbnail_prompts_vertical_length check (char_length(vertical_prompt) between 1 and 20000)
);

create table if not exists public.hashtag_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  platform public.content_platform,
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hashtag_collections_name_length check (char_length(name) between 1 and 80),
  constraint hashtag_collections_tags_bounds check (cardinality(hashtags) between 1 and 40)
);

create index if not exists contents_user_status_idx on public.contents (user_id, status);
create index if not exists contents_user_planned_idx on public.contents (user_id, planned_date);
create index if not exists contents_user_platform_idx on public.contents (user_id, platform);
create index if not exists contents_user_updated_idx on public.contents (user_id, updated_at desc);
create index if not exists categories_user_idx on public.categories (user_id);
create index if not exists thumbnail_prompts_user_idx on public.thumbnail_prompts (user_id, created_at desc);
create index if not exists hashtag_collections_user_idx on public.hashtag_collections (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists contents_set_updated_at on public.contents;
create trigger contents_set_updated_at
before update on public.contents
for each row execute function public.set_updated_at();

drop trigger if exists thumbnail_prompts_set_updated_at on public.thumbnail_prompts;
create trigger thumbnail_prompts_set_updated_at
before update on public.thumbnail_prompts
for each row execute function public.set_updated_at();

drop trigger if exists hashtag_collections_set_updated_at on public.hashtag_collections;
create trigger hashtag_collections_set_updated_at
before update on public.hashtag_collections
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.contents enable row level security;
alter table public.thumbnail_prompts enable row level security;
alter table public.hashtag_collections enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists categories_own on public.categories;
create policy categories_own on public.categories
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists contents_own on public.contents;
create policy contents_own on public.contents
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists thumbnail_prompts_own on public.thumbnail_prompts;
create policy thumbnail_prompts_own on public.thumbnail_prompts
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists hashtag_collections_own on public.hashtag_collections;
create policy hashtag_collections_own on public.hashtag_collections
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.contents to authenticated;
grant select, insert, update, delete on public.thumbnail_prompts to authenticated;
grant select, insert, update, delete on public.hashtag_collections to authenticated;

revoke all on table public.profiles, public.categories, public.contents, public.thumbnail_prompts, public.hashtag_collections from public, anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists thumbnails_read_own on storage.objects;
create policy thumbnails_read_own on storage.objects
for select to authenticated
using (
  bucket_id = 'thumbnails'
  and position('..' in name) = 0
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists thumbnails_insert_own on storage.objects;
create policy thumbnails_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'thumbnails'
  and position('..' in name) = 0
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists thumbnails_update_own on storage.objects;
create policy thumbnails_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'thumbnails'
  and position('..' in name) = 0
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'thumbnails'
  and position('..' in name) = 0
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists thumbnails_delete_own on storage.objects;
create policy thumbnails_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'thumbnails'
  and position('..' in name) = 0
  and (storage.foldername(name))[1] = auth.uid()::text
);
