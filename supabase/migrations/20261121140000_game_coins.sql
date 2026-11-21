-- Fun-mode coins. Run after the marketplace migration.
-- 1 coin = ₹1 in the skill shop. Claims are capped per round and per day.

alter table public.marketplace_purchases
  add column if not exists paid_with_coins boolean not null default false;

create table if not exists public.game_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  coins integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint game_wallets_coins_bounds check (coins >= 0 and coins <= 1000000)
);

create table if not exists public.game_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game text not null,
  score integer not null,
  duration_ms integer not null,
  coins integer not null,
  created_at timestamptz not null default now(),
  constraint game_claims_game_check check (game in ('memory', 'catch', 'sparks')),
  constraint game_claims_score_bounds check (score >= 0 and score <= 20000),
  constraint game_claims_duration_bounds check (duration_ms >= 15000 and duration_ms <= 1800000),
  constraint game_claims_coins_bounds check (coins >= 0 and coins <= 18)
);

create index if not exists game_claims_user_created_idx on public.game_claims (user_id, created_at desc);

create or replace function public.preview_game_coins(p_score integer, p_duration_ms integer)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  duration integer;
  score_cap integer;
begin
  duration := least(greatest(coalesce(p_duration_ms, 0), 0), 1800000);
  if duration < 20000 then
    return 0;
  end if;
  score_cap := least(greatest(coalesce(p_score, 0), 0), duration / 50, 20000);
  return least(18, (score_cap / 15) + (duration / 30000));
end;
$$;

create or replace function public.claim_game_coins(p_game text, p_score integer, p_duration_ms integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  awarded integer;
  earned_today integer;
  last_claim timestamptz;
  new_balance integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to claim coins.';
  end if;
  if p_game not in ('memory', 'catch', 'sparks') then
    raise exception 'Unknown game.';
  end if;
  awarded := public.preview_game_coins(p_score, p_duration_ms);
  if awarded <= 0 then
    raise exception 'Play at least 20 seconds, then claim.';
  end if;

  select created_at into last_claim
  from public.game_claims
  where user_id = auth.uid()
  order by created_at desc
  limit 1;
  if last_claim is not null and last_claim > now() - interval '20 seconds' then
    raise exception 'Wait a few seconds before another claim.';
  end if;

  select coalesce(sum(coins), 0) into earned_today
  from public.game_claims
  where user_id = auth.uid()
    and created_at >= date_trunc('day', timezone('utc', now()));
  if earned_today >= 500 then
    raise exception 'Daily coin limit reached. Come back tomorrow.';
  end if;
  awarded := least(awarded, 500 - earned_today);

  insert into public.game_claims (user_id, game, score, duration_ms, coins)
  values (auth.uid(), p_game, least(greatest(p_score, 0), 20000), least(greatest(p_duration_ms, 0), 1800000), awarded);

  insert into public.game_wallets (user_id, coins)
  values (auth.uid(), awarded)
  on conflict (user_id) do update
    set coins = public.game_wallets.coins + excluded.coins,
        updated_at = now();

  select coins into new_balance from public.game_wallets where user_id = auth.uid();
  return jsonb_build_object('ok', true, 'awarded', awarded, 'balance', new_balance);
end;
$$;

create or replace function public.redeem_listing_with_coins(p_listing_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  listed_price integer;
  is_listed boolean;
  cost integer;
  wallet integer;
  new_balance integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to buy with coins.';
  end if;
  select price_paise, listed into listed_price, is_listed
  from public.marketplace_listings
  where id = p_listing_id;
  if listed_price is null or is_listed is not true then
    raise exception 'That skill is not on sale.';
  end if;
  if exists (
    select 1 from public.marketplace_purchases
    where listing_id = p_listing_id and buyer_id = auth.uid() and status = 'paid'
  ) then
    raise exception 'You already have this skill.';
  end if;

  cost := ceil(listed_price::numeric / 100);
  select coins into wallet from public.game_wallets where user_id = auth.uid();
  wallet := coalesce(wallet, 0);
  if cost > 0 and wallet < cost then
    raise exception 'Not enough coins. Play Fun mode to earn more.';
  end if;
  if cost > 0 then
    update public.game_wallets
      set coins = coins - cost, updated_at = now()
      where user_id = auth.uid();
  end if;

  perform set_config('app.coin_redeem', '1', true);
  if exists (
    select 1 from public.marketplace_purchases
    where listing_id = p_listing_id and buyer_id = auth.uid()
  ) then
    update public.marketplace_purchases
      set status = 'paid', paid_with_coins = true, amount_paise = listed_price
      where listing_id = p_listing_id and buyer_id = auth.uid();
  else
    insert into public.marketplace_purchases (listing_id, buyer_id, status, amount_paise, paid_with_coins)
    values (p_listing_id, auth.uid(), 'paid', listed_price, true);
  end if;

  select coins into new_balance from public.game_wallets where user_id = auth.uid();
  return jsonb_build_object('ok', true, 'balance', coalesce(new_balance, 0), 'spent', cost);
end;
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
    new.paid_with_coins := false;
  elsif current_setting('app.coin_redeem', true) = '1' then
    new.status := 'paid';
    new.paid_with_coins := true;
  else
    new.status := 'checkout_soon';
    new.paid_with_coins := false;
  end if;
  return new;
end;
$$;

revoke all on function public.preview_game_coins(integer, integer) from public, anon;
grant execute on function public.preview_game_coins(integer, integer) to authenticated;
revoke all on function public.claim_game_coins(text, integer, integer) from public, anon;
grant execute on function public.claim_game_coins(text, integer, integer) to authenticated;
revoke all on function public.redeem_listing_with_coins(uuid) from public, anon;
grant execute on function public.redeem_listing_with_coins(uuid) to authenticated;

alter table public.game_wallets enable row level security;
alter table public.game_claims enable row level security;

drop policy if exists game_wallets_own_read on public.game_wallets;
create policy game_wallets_own_read on public.game_wallets
for select to authenticated
using (user_id = auth.uid());

drop policy if exists game_claims_own_read on public.game_claims;
create policy game_claims_own_read on public.game_claims
for select to authenticated
using (user_id = auth.uid());

grant select on public.game_wallets to authenticated;
grant select on public.game_claims to authenticated;
revoke all on table public.game_wallets, public.game_claims from public, anon;
