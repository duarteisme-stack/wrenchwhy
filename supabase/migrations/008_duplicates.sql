-- Duplicate protection. Safe to run once. If old data already has duplicates, that index is skipped with a notice.
create or replace function public.phone_taken(p_phone text) returns boolean language sql security definer stable set search_path=public as $$
select exists(select 1 from profiles where regexp_replace(coalesce(phone,''),'\D','','g')=regexp_replace(coalesce(p_phone,''),'\D','','g') and regexp_replace(coalesce(p_phone,''),'\D','','g')<>'') $$;
grant execute on function public.phone_taken(text) to anon,authenticated;
do $$ begin
 create unique index if not exists profiles_phone_uq on profiles ((regexp_replace(coalesce(phone,''),'\D','','g'))) where coalesce(phone,'')<>'';
exception when others then raise notice 'Phone index skipped: %',sqlerrm; end $$;
do $$ begin
 create unique index if not exists vehicles_plate_uq on vehicles (owner_id,(upper(regexp_replace(coalesce(plate_number,''),'\s','','g')))) where coalesce(plate_number,'')<>'';
exception when others then raise notice 'Plate index skipped: %',sqlerrm; end $$;
