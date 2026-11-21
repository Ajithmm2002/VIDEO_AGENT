-- Skill marketplace. Run this in the SQL editor after the init migration.
-- Then add your sign-in email:
--   insert into public.app_admins (email) values ('you@example.com')
--   on conflict do nothing;
-- Also set MARKETPLACE_ADMIN_EMAIL in .env.local and Vercel to the same address.

create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint app_admins_email_length check (char_length(email) between 3 and 320)
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  description text not null,
  offerings text[] not null default '{}',
  kind text not null,
  price_paise integer not null default 0,
  currency text not null default 'INR',
  listed boolean not null default false,
  file_path text,
  file_name text,
  file_ext text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_listings_title_length check (char_length(title) between 1 and 120),
  constraint marketplace_listings_description_length check (char_length(description) between 1 and 8000),
  constraint marketplace_listings_offerings_bounds check (cardinality(offerings) <= 12),
  constraint marketplace_listings_kind_check check (kind in ('skill', 'bundle')),
  constraint marketplace_listings_price_bounds check (price_paise >= 0 and price_paise <= 100000000),
  constraint marketplace_listings_currency_check check (currency = 'INR'),
  constraint marketplace_listings_file_ext_check check (file_ext is null or file_ext in ('md', 'zip'))
);

create table if not exists public.marketplace_purchases (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  status text not null,
  amount_paise integer not null,
  created_at timestamptz not null default now(),
  constraint marketplace_purchases_status_check check (status in ('checkout_soon', 'paid')),
  constraint marketplace_purchases_amount_bounds check (amount_paise >= 0 and amount_paise <= 100000000),
  constraint marketplace_purchases_unique unique (listing_id, buyer_id)
);

create index if not exists marketplace_listings_listed_idx on public.marketplace_listings (listed, created_at desc);
create index if not exists marketplace_purchases_buyer_idx on public.marketplace_purchases (buyer_id, created_at desc);

drop trigger if exists marketplace_listings_set_updated_at on public.marketplace_listings;
create trigger marketplace_listings_set_updated_at
before update on public.marketplace_listings
for each row execute function public.set_updated_at();

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.marketplace_purchase_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  listed_price integer;
  is_listed boolean;
begin
  if new.buyer_id is distinct from auth.uid() then
    raise exception 'You can only buy for your own account.';
  end if;
  select price_paise, listed
    into listed_price, is_listed
  from public.marketplace_listings
  where id = new.listing_id;
  if listed_price is null or is_listed is not true then
    raise exception 'That skill is not on sale.';
  end if;
  new.amount_paise := listed_price;
  if listed_price = 0 then
    new.status := 'paid';
  else
    new.status := 'checkout_soon';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_purchases_guard on public.marketplace_purchases;
create trigger marketplace_purchases_guard
before insert on public.marketplace_purchases
for each row execute function public.marketplace_purchase_guard();

revoke all on function public.is_app_admin() from public, anon, authenticated;
grant execute on function public.is_app_admin() to authenticated;
revoke all on function public.marketplace_purchase_guard() from public, anon, authenticated;

alter table public.app_admins enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_purchases enable row level security;

drop policy if exists app_admins_none on public.app_admins;
create policy app_admins_none on public.app_admins
for all to authenticated
using (false)
with check (false);

drop policy if exists marketplace_listings_read on public.marketplace_listings;
create policy marketplace_listings_read on public.marketplace_listings
for select to authenticated
using (listed = true or public.is_app_admin());

drop policy if exists marketplace_listings_write on public.marketplace_listings;
create policy marketplace_listings_write on public.marketplace_listings
for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists marketplace_purchases_own_read on public.marketplace_purchases;
create policy marketplace_purchases_own_read on public.marketplace_purchases
for select to authenticated
using (buyer_id = auth.uid() or public.is_app_admin());

drop policy if exists marketplace_purchases_own_insert on public.marketplace_purchases;
create policy marketplace_purchases_own_insert on public.marketplace_purchases
for insert to authenticated
with check (buyer_id = auth.uid());

grant select, insert, update, delete on public.marketplace_listings to authenticated;
grant select, insert on public.marketplace_purchases to authenticated;
revoke all on table public.app_admins from public, anon, authenticated;
revoke all on table public.marketplace_listings, public.marketplace_purchases from public, anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketplace-files',
  'marketplace-files',
  false,
  8388608,
  array[
    'text/markdown',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream'
  ]
)
on conflict (id) do nothing;

drop policy if exists marketplace_files_read on storage.objects;
create policy marketplace_files_read on storage.objects
for select to authenticated
using (
  bucket_id = 'marketplace-files'
  and position('..' in name) = 0
  and (
    public.is_app_admin()
    or exists (
      select 1
      from public.marketplace_purchases p
      join public.marketplace_listings l on l.id = p.listing_id
      where p.buyer_id = auth.uid()
        and p.status = 'paid'
        and l.file_path = name
    )
  )
);

drop policy if exists marketplace_files_write on storage.objects;
create policy marketplace_files_write on storage.objects
for all to authenticated
using (
  bucket_id = 'marketplace-files'
  and position('..' in name) = 0
  and public.is_app_admin()
)
with check (
  bucket_id = 'marketplace-files'
  and position('..' in name) = 0
  and public.is_app_admin()
);
