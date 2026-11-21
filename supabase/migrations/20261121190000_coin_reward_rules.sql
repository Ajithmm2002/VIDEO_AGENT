-- Studio coins are in-app rewards only: no transfer, no cash-out.
-- Wallets stay on the signed-in account. Spend is only redeem_listing_with_coins.

revoke insert, update, delete on table public.game_wallets from public, anon, authenticated;
revoke insert, update, delete on table public.game_claims from public, anon, authenticated;
grant select on table public.game_wallets to authenticated;
grant select on table public.game_claims to authenticated;

drop policy if exists game_wallets_own_write on public.game_wallets;
drop policy if exists game_claims_own_write on public.game_claims;

create or replace function public.game_rewards_no_transfer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'Studio coins cannot be transferred.';
  end if;
  if tg_op = 'INSERT' and new.user_id is distinct from auth.uid() and auth.uid() is not null then
    raise exception 'Studio coins stay on your own account.';
  end if;
  return new;
end;
$$;

drop trigger if exists game_wallets_no_transfer on public.game_wallets;
create trigger game_wallets_no_transfer
  before insert or update on public.game_wallets
  for each row execute function public.game_rewards_no_transfer();

drop trigger if exists game_claims_no_transfer on public.game_claims;
create trigger game_claims_no_transfer
  before insert or update on public.game_claims
  for each row execute function public.game_rewards_no_transfer();

comment on table public.game_wallets is
  'In-app studio coin balance. Redeemable only via redeem_listing_with_coins in this shop. Not transferable and not cash.';
comment on table public.game_claims is
  'Fun mode coin claims for the signed-in user. Not transferable.';
comment on function public.redeem_listing_with_coins(uuid) is
  'Spend studio coins on a listed skill in this shop. Coins are not converted to cash or gift cards.';
