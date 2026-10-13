alter table profiles add column if not exists active_device text;
create or replace function public.claim_session(p_device text) returns void language plpgsql security definer set search_path=public as $$
begin if auth.uid() is null then raise exception 'Login required';end if;update profiles set active_device=p_device where id=auth.uid();end $$;
create or replace function public.session_ok(p_device text) returns boolean language sql security definer stable set search_path=public as $$
select coalesce((select active_device is null or active_device=p_device from profiles where id=auth.uid()),true) $$;
grant execute on function public.claim_session(text),public.session_ok(text) to authenticated;
