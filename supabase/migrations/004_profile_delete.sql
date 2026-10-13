create or replace function public.update_my_profile(p_name text,p_phone text) returns void language plpgsql security definer set search_path=public as $$
begin if auth.uid() is null then raise exception 'Login required';end if;if length(trim(p_name))<2 then raise exception 'Enter your full name';end if;
update profiles set full_name=trim(p_name),phone=trim(p_phone) where id=auth.uid();end $$;
create or replace function public.admin_delete_customer(p_uid uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'Admin only';end if;
if exists(select 1 from profiles where id=p_uid and role<>'customer') then raise exception 'Only customer accounts can be deleted';end if;
if exists(select 1 from appointments where customer_id=p_uid) then raise exception 'This customer has appointments. Suspend the account instead.';end if;
delete from vehicles where owner_id=p_uid;delete from auth.users where id=p_uid;
insert into audit_logs(actor,action,record_type,record_id) values(auth.uid(),'delete_customer','profile',p_uid::text);end $$;
grant execute on function public.update_my_profile(text,text),public.admin_delete_customer(uuid) to authenticated;
