-- One-time 9,900-coin welcome bonus for the test account.
-- Safe to run more than once.

alter table public.game_wallets
  add column if not exists welcome_bonus_at timestamptz;

create or replace function public.grant_welcome_bonus()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  bonus integer := 9900;
  allowed text := 'ajithmmkt2002@gmail.com';
  new_coins integer;
  new_earned integer;
  granted_at timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'granted', false);
  end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) is distinct from allowed then
    return jsonb_build_object('ok', false, 'granted', false);
  end if;

  insert into public.game_wallets (user_id, coins, earned, welcome_bonus_at, updated_at)
  values (auth.uid(), bonus, bonus, now(), now())
  on conflict (user_id) do update
    set coins = public.game_wallets.coins + excluded.coins,
        earned = coalesce(public.game_wallets.earned, 0) + excluded.earned,
        welcome_bonus_at = now(),
        updated_at = now()
    where public.game_wallets.welcome_bonus_at is null;

  select coins, earned, welcome_bonus_at
    into new_coins, new_earned, granted_at
  from public.game_wallets
  where user_id = auth.uid();

  return jsonb_build_object(
    'ok', true,
    'granted', granted_at is not null,
    'balance', coalesce(new_coins, 0),
    'earned', coalesce(new_earned, 0)
  );
end;
$$;

revoke all on function public.grant_welcome_bonus() from public, anon;
grant execute on function public.grant_welcome_bonus() to authenticated;

insert into public.game_wallets (user_id, coins, earned, welcome_bonus_at, updated_at)
select users.id, 9900, 9900, now(), now()
from auth.users as users
where lower(users.email) = 'ajithmmkt2002@gmail.com'
on conflict (user_id) do update
  set coins = public.game_wallets.coins + 9900,
      earned = coalesce(public.game_wallets.earned, 0) + 9900,
      welcome_bonus_at = now(),
      updated_at = now()
  where public.game_wallets.welcome_bonus_at is null;
