create or replace function public.block_admin_booking() returns trigger language plpgsql security definer set search_path=public as $$
begin if is_admin() then raise exception 'Admin accounts cannot book appointments. Use a customer account.';end if;return new;end $$;
drop trigger if exists no_admin_booking on appointments;
create trigger no_admin_booking before insert on appointments for each row execute function public.block_admin_booking();
