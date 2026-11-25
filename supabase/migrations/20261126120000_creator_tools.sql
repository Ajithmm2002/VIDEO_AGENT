-- Creator tools: weekly goal and streak, onboarding, calendar sync, public creator page with
-- link-in-bio, brand deals, and read-only review links.
-- Run this whole file once in the Supabase SQL editor, after the earlier migrations.
-- Safe to run again.
--
-- Public pages never use a secret key. They call the small security definer functions at the
-- bottom of this file, which return only the fields a visitor may see, and only when the owner
-- turned the page on or shared a link with an unguessable token.

-- ---------------------------------------------------------------------------
-- Fix: the original video_url and published_url checks used a regex repeat count of 2000,
-- which Postgres rejects (the limit is 255). Any save with a video or published link failed.
-- Same rule, written so Postgres accepts it.
-- ---------------------------------------------------------------------------

alter table public.contents drop constraint if exists contents_video_url_https;
alter table public.contents add constraint contents_video_url_https
  check (video_url is null or (video_url ~ '^https://[^[:space:]]+$' and char_length(video_url) <= 2008));

alter table public.contents drop constraint if exists contents_published_url_https;
alter table public.contents add constraint contents_published_url_https
  check (published_url is null or (published_url ~ '^https://[^[:space:]]+$' and char_length(published_url) <= 2008));

-- ---------------------------------------------------------------------------
-- Profiles: weekly goal, onboarding, calendar token, public creator page
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists weekly_goal integer not null default 3;
alter table public.profiles add column if not exists onboarding_dismissed_at timestamptz;
alter table public.profiles add column if not exists calendar_token text;
alter table public.profiles add column if not exists public_handle text;
alter table public.profiles add column if not exists page_public boolean not null default false;
alter table public.profiles add column if not exists page jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_weekly_goal_bounds;
alter table public.profiles add constraint profiles_weekly_goal_bounds check (weekly_goal between 1 and 21);

alter table public.profiles drop constraint if exists profiles_calendar_token_format;
alter table public.profiles add constraint profiles_calendar_token_format
  check (calendar_token is null or calendar_token ~ '^[A-Za-z0-9_-]{32,64}$');

alter table public.profiles drop constraint if exists profiles_public_handle_format;
alter table public.profiles add constraint profiles_public_handle_format
  check (public_handle is null or public_handle ~ '^[a-z0-9_]{3,30}$');

alter table public.profiles drop constraint if exists profiles_page_object;
alter table public.profiles add constraint profiles_page_object
  check (jsonb_typeof(page) = 'object' and length(page::text) <= 6000);

create unique index if not exists profiles_calendar_token_key on public.profiles (calendar_token);
create unique index if not exists profiles_public_handle_key on public.profiles (public_handle);

-- ---------------------------------------------------------------------------
-- Contents: publish date (for goals and streaks) and review links
-- ---------------------------------------------------------------------------

alter table public.contents add column if not exists published_at timestamptz;
alter table public.contents add column if not exists share_token text;

alter table public.contents drop constraint if exists contents_share_token_format;
alter table public.contents add constraint contents_share_token_format
  check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{32,64}$');

create unique index if not exists contents_share_token_key on public.contents (share_token);
create index if not exists contents_user_published_idx on public.contents (user_id, published_at desc);

update public.contents
set published_at = coalesce(planned_date::timestamptz, updated_at)
where status = 'published' and published_at is null;

create or replace function public.contents_track_published()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT' or old.status is distinct from 'published' or new.published_at is null then
      new.published_at := coalesce(new.published_at, now());
    end if;
  else
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists contents_track_published on public.contents;
create trigger contents_track_published
before insert or update of status on public.contents
for each row execute function public.contents_track_published();

revoke all on function public.contents_track_published() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Brand deals
-- ---------------------------------------------------------------------------

create table if not exists public.brand_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  brand text not null,
  status text not null default 'pitch',
  amount_paise bigint,
  due_date date,
  deliverables text,
  contact text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_deals_brand_length check (char_length(btrim(brand)) between 1 and 80),
  constraint brand_deals_status_valid check (status in ('pitch', 'negotiating', 'agreed', 'delivered', 'paid', 'lost')),
  constraint brand_deals_amount_bounds check (amount_paise is null or amount_paise between 0 and 100000000000),
  constraint brand_deals_deliverables_length check (deliverables is null or char_length(deliverables) <= 1000),
  constraint brand_deals_contact_length check (contact is null or char_length(contact) <= 200),
  constraint brand_deals_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists brand_deals_user_idx on public.brand_deals (user_id, status, due_date);

drop trigger if exists brand_deals_set_updated_at on public.brand_deals;
create trigger brand_deals_set_updated_at
before update on public.brand_deals
for each row execute function public.set_updated_at();

alter table public.brand_deals enable row level security;

drop policy if exists brand_deals_own on public.brand_deals;
create policy brand_deals_own on public.brand_deals
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.brand_deals to authenticated;

-- ---------------------------------------------------------------------------
-- Creator page links (link-in-bio)
-- ---------------------------------------------------------------------------

create table if not exists public.creator_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  position integer not null default 0,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  constraint creator_links_title_length check (char_length(btrim(title)) between 1 and 60),
  constraint creator_links_url_https check (url ~ '^https://[^[:space:]]+$' and char_length(url) <= 2008),
  constraint creator_links_clicks_nonnegative check (clicks >= 0)
);

create index if not exists creator_links_user_idx on public.creator_links (user_id, position);

alter table public.creator_links enable row level security;

drop policy if exists creator_links_own on public.creator_links;
create policy creator_links_own on public.creator_links
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.creator_links to authenticated;

-- ---------------------------------------------------------------------------
-- Public, read-only functions
-- ---------------------------------------------------------------------------

-- The public creator page: name, page fields, and link titles. Only when the owner turned it on.
create or replace function public.creator_page(p_handle text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'handle', p.public_handle,
    'display_name', p.display_name,
    'page', p.page,
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'title', l.title) order by l.position, l.created_at)
      from public.creator_links l
      where l.user_id = p.id
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.public_handle = lower(btrim(p_handle))
    and p.page_public = true
  limit 1;
$$;

-- Count a click on a public link and return where to send the visitor.
create or replace function public.follow_creator_link(p_link_id uuid)
returns text
language sql
volatile
security definer
set search_path = public
as $$
  update public.creator_links l
  set clicks = l.clicks + 1
  from public.profiles p
  where l.id = p_link_id
    and p.id = l.user_id
    and p.page_public = true
  returning l.url;
$$;

-- Where a public link goes, without counting a click (used for repeat visits).
create or replace function public.creator_link_url(p_link_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select l.url
  from public.creator_links l
  join public.profiles p on p.id = l.user_id
  where l.id = p_link_id
    and p.page_public = true
  limit 1;
$$;

-- A single content item shared for review. Only the fields a reviewer needs.
create or replace function public.shared_content(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'title', c.title,
    'topic', c.topic,
    'platform', c.platform,
    'language', c.language,
    'status', c.status,
    'planned_date', c.planned_date,
    'description', c.description,
    'youtube_description', c.youtube_description,
    'instagram_caption', c.instagram_caption,
    'tags', c.tags,
    'hashtags', c.hashtags,
    'script_notes', c.script_notes,
    'updated_at', c.updated_at,
    'author', p.display_name
  )
  from public.contents c
  left join public.profiles p on p.id = c.user_id
  where p_token ~ '^[A-Za-z0-9_-]{32,64}$'
    and c.share_token = p_token
  limit 1;
$$;

-- Dated items for a private calendar subscription link.
create or replace function public.calendar_feed(p_token text)
returns table (id uuid, title text, planned_date date, status text, platform text, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.title, c.planned_date, c.status::text, c.platform::text, c.updated_at
  from public.contents c
  join public.profiles p on p.id = c.user_id
  where p_token ~ '^[A-Za-z0-9_-]{32,64}$'
    and p.calendar_token = p_token
    and c.planned_date is not null
    and c.is_template = false
  order by c.planned_date
  limit 1000;
$$;

revoke all on function public.creator_page(text) from public;
revoke all on function public.follow_creator_link(uuid) from public;
revoke all on function public.creator_link_url(uuid) from public;
revoke all on function public.shared_content(text) from public;
revoke all on function public.calendar_feed(text) from public;

grant execute on function public.creator_page(text) to anon, authenticated;
grant execute on function public.follow_creator_link(uuid) to anon, authenticated;
grant execute on function public.creator_link_url(uuid) to anon, authenticated;
grant execute on function public.shared_content(text) to anon, authenticated;
grant execute on function public.calendar_feed(text) to anon, authenticated;
