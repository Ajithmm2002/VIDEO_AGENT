-- Lets the shop owner confirm a rupee payment so the buyer can download.
-- Run this in the SQL editor if Buy with rupees stays on "pending".

create or replace function public.admin_fulfill_money_purchase(p_listing_id uuid, p_buyer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  listed_price integer;
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Only the shop owner can confirm a rupee payment.';
  end if;
  select price_paise into listed_price
  from public.marketplace_listings
  where id = p_listing_id and listed is true;
  if listed_price is null then
    raise exception 'That skill is not on sale.';
  end if;
  if exists (
    select 1 from public.marketplace_purchases
    where listing_id = p_listing_id and buyer_id = p_buyer_id and status = 'paid'
  ) then
    return jsonb_build_object('ok', true, 'status', 'paid');
  end if;
  update public.marketplace_purchases
    set status = 'paid', paid_with_coins = false, amount_paise = listed_price
    where listing_id = p_listing_id and buyer_id = p_buyer_id;
  if not found then
    raise exception 'That buyer has not started a rupee checkout.';
  end if;
  return jsonb_build_object('ok', true, 'status', 'paid');
end;
$$;

revoke all on function public.admin_fulfill_money_purchase(uuid, uuid) from public, anon;
grant execute on function public.admin_fulfill_money_purchase(uuid, uuid) to authenticated;
