-- 100 studio coins = ₹1. Run after the earlier game-coin SQL files.

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

  cost := ceil(listed_price::numeric * 100 / 100);
  select coins into wallet from public.game_wallets where user_id = auth.uid();
  wallet := coalesce(wallet, 0);
  if cost > 0 and wallet < cost then
    raise exception 'Not enough coins. Use Buy now when Razorpay is ready, or keep playing Fun mode.';
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
