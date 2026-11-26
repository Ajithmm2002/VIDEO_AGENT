-- About my channel: private details the AI uses to write ideas for this creator's niche.
-- Run once in the Supabase SQL editor, after 20261126120000_creator_tools.sql. Safe to run again.
-- Kept apart from the public creator page (profiles.page), so nothing here is ever shown publicly.

alter table public.profiles add column if not exists channel jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_channel_object;
alter table public.profiles add constraint profiles_channel_object
  check (jsonb_typeof(channel) = 'object' and length(channel::text) <= 4000);
