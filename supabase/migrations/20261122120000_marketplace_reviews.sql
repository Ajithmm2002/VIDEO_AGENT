-- Product reviews and star ratings for the marketplace.
-- Run this in the SQL editor after the marketplace and coin migrations.

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null,
  body text not null,
  author_label text not null default 'Customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_reviews_rating_bounds check (rating between 1 and 5),
  constraint marketplace_reviews_body_length check (char_length(btrim(body)) between 8 and 280),
  constraint marketplace_reviews_author_label_length check (char_length(author_label) between 1 and 40),
  constraint marketplace_reviews_unique unique (listing_id, reviewer_id)
);

create index if not exists marketplace_reviews_listing_idx
  on public.marketplace_reviews (listing_id, created_at desc);

drop trigger if exists marketplace_reviews_set_updated_at on public.marketplace_reviews;
create trigger marketplace_reviews_set_updated_at
before update on public.marketplace_reviews
for each row execute function public.set_updated_at();

create or replace function public.marketplace_review_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reviewer_id is distinct from auth.uid() then
    raise exception 'You can only review from your own account.';
  end if;
  if tg_op = 'UPDATE' then
    new.listing_id := old.listing_id;
    new.reviewer_id := old.reviewer_id;
  end if;
  if not exists (
    select 1
    from public.marketplace_purchases p
    where p.listing_id = new.listing_id
      and p.buyer_id = auth.uid()
      and p.status = 'paid'
  ) then
    raise exception 'Buy this product before you leave a review.';
  end if;
  new.body := btrim(new.body);
  new.author_label := left(btrim(new.author_label), 40);
  if new.author_label = '' then
    new.author_label := 'Customer';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_reviews_guard on public.marketplace_reviews;
create trigger marketplace_reviews_guard
before insert or update on public.marketplace_reviews
for each row execute function public.marketplace_review_guard();

revoke all on function public.marketplace_review_guard() from public, anon, authenticated;

alter table public.marketplace_reviews enable row level security;

drop policy if exists marketplace_reviews_read on public.marketplace_reviews;
create policy marketplace_reviews_read on public.marketplace_reviews
for select to authenticated
using (
  exists (
    select 1
    from public.marketplace_listings l
    where l.id = listing_id
      and (l.listed = true or public.is_app_admin())
  )
);

drop policy if exists marketplace_reviews_write on public.marketplace_reviews;
create policy marketplace_reviews_write on public.marketplace_reviews
for insert to authenticated
with check (reviewer_id = auth.uid());

drop policy if exists marketplace_reviews_update on public.marketplace_reviews;
create policy marketplace_reviews_update on public.marketplace_reviews
for update to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());

drop policy if exists marketplace_reviews_delete on public.marketplace_reviews;
create policy marketplace_reviews_delete on public.marketplace_reviews
for delete to authenticated
using (reviewer_id = auth.uid() or public.is_app_admin());

grant select, insert, update, delete on public.marketplace_reviews to authenticated;
revoke all on table public.marketplace_reviews from public, anon;
