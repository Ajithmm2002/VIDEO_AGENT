-- 10 studio coins = ₹1. Play payouts are a little easier. Tracks lifetime earned.
-- Run after 20261121140000_game_coins.sql (and 20261121153000 if you already ran it).

alter table public.game_wallets
  add column if not exists earned integer not null default 0;

alter table public.game_wallets drop constraint if exists game_wallets_earned_bounds;
alter table public.game_wallets
  add constraint game_wallets_earned_bounds check (earned >= 0 and earned <= 10000000);

update public.game_wallets as wallet
set earned = greatest(
  wallet.earned,
  coalesce((select sum(claim.coins) from public.game_claims as claim where claim.user_id = wallet.user_id), 0)
);

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
  score_cap := least(greatest(coalesce(p_score, 0), 0), duration / 80, 12000);
  return least(12, (score_cap / 30) + (duration / 40000));
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
  new_earned integer;
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
  if last_claim is not null and last_claim > now() - interval '30 seconds' then
    raise exception 'Wait a few seconds before another claim.';
  end if;

  select coalesce(sum(coins), 0) into earned_today
  from public.game_claims
  where user_id = auth.uid()
    and created_at >= date_trunc('day', timezone('utc', now()));
  if earned_today >= 400 then
    raise exception 'Daily coin limit reached. Come back tomorrow.';
  end if;
  awarded := least(awarded, 400 - earned_today);

  insert into public.game_claims (user_id, game, score, duration_ms, coins)
  values (auth.uid(), p_game, least(greatest(p_score, 0), 20000), least(greatest(p_duration_ms, 0), 1800000), awarded);

  insert into public.game_wallets (user_id, coins, earned)
  values (auth.uid(), awarded, awarded)
  on conflict (user_id) do update
    set coins = public.game_wallets.coins + excluded.coins,
        earned = public.game_wallets.earned + excluded.earned,
        updated_at = now();

  select coins, earned into new_balance, new_earned from public.game_wallets where user_id = auth.uid();
  return jsonb_build_object('ok', true, 'awarded', awarded, 'balance', new_balance, 'earned', new_earned);
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

  cost := ceil(listed_price::numeric * 10 / 100);
  select coins into wallet from public.game_wallets where user_id = auth.uid();
  wallet := coalesce(wallet, 0);
  if cost > 0 and wallet < cost then
    raise exception 'Not enough coins. Pay in rupees, or keep playing Fun mode.';
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
