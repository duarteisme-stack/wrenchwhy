-- Run after 001. Safe to run once.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name,phone,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone',new.email);return new;end $$;
alter function public.is_admin() set search_path=public;
alter function public.is_approved() set search_path=public;
alter function public.set_approval(uuid,text) set search_path=public;

alter table appointments add column if not exists start_at timestamptz generated always as (lower(during)) stored;
alter table appointments add column if not exists end_at timestamptz generated always as (upper(during)) stored;
alter table appointments add column if not exists qr_token text unique;

-- Customers must not read private mechanic notes: only admins read the table; everyone reads this safe view.
drop policy if exists w_sel on workers;
create or replace view public_workers as select id,full_name,photo_url,specialties,qualified_service_ids from workers where active;
grant select on public_workers to anon,authenticated;
grant select on services to anon,authenticated;

-- Public busy times (no customer data) so logged-out visitors can see the calendar.
create or replace function public.get_busy(p_from timestamptz,p_to timestamptz) returns table(worker_id uuid,start_at timestamptz,end_at timestamptz)
language sql security definer set search_path=public stable as $$
 select a.worker_id,a.start_at,a.end_at from appointments a
 where a.status in('awaiting_payment','confirmed','checked_in','in_progress') and a.start_at<p_to and a.end_at>p_from $$;
grant execute on function public.get_busy(timestamptz,timestamptz) to anon,authenticated;

create or replace function public.book_appointment(p_service uuid,p_vehicle uuid,p_worker uuid,p_start timestamptz) returns json
language plpgsql security definer set search_path=public,extensions as $$
declare s services;w workers;v vehicles;tok text;aid uuid:=gen_random_uuid();ls timestamp;le timestamp;ref text;
begin
 if auth.uid() is null then raise exception 'Login required';end if;
 if not is_approved() then raise exception 'Account not approved yet';end if;
 select * into s from services where id=p_service and active;if not found then raise exception 'Service unavailable';end if;
 select * into w from workers where id=p_worker and active;if not found or not(p_service=any(w.qualified_service_ids)) then raise exception 'Mechanic not eligible';end if;
 select * into v from vehicles where id=p_vehicle and owner_id=auth.uid();if not found then raise exception 'Not your vehicle';end if;
 if p_start<now() then raise exception 'Time is in the past';end if;
 ls:=p_start at time zone 'Asia/Manila';le:=(p_start+make_interval(mins=>s.duration_minutes)) at time zone 'Asia/Manila';
 if extract(dow from ls)=0 or ls::time<time '08:00' or le::date<>ls::date or le::time>time '17:00' then raise exception 'Outside shop hours (Mon-Sat, 8:00 to 17:00)';end if;
 tok:=encode(gen_random_bytes(24),'hex');ref:='WW-'||upper(substr(aid::text,1,8));
 begin
  insert into appointments(id,reference,customer_id,vehicle_id,service_id,service_name_snapshot,price_snapshot,duration_snapshot,worker_id,during,status,payment_status,amount_due,qr_token,qr_token_hash)
  values(aid,ref,auth.uid(),p_vehicle,p_service,s.name,s.price,s.duration_minutes,p_worker,tstzrange(p_start,p_start+make_interval(mins=>s.duration_minutes)),'confirmed','pay_at_shop',s.price,tok,encode(digest(tok,'sha256'),'hex'));
 exception when exclusion_violation then raise exception 'Slot taken, pick another time';end;
 return json_build_object('appointment_id',aid,'qr_token',tok,'reference',ref);end $$;

create or replace function public.verify_qr(p_token text) returns json language plpgsql security definer set search_path=public as $$
declare r json;begin
 if not is_admin() then raise exception 'Admin only';end if;
 select json_build_object('id',a.id,'reference',a.reference,'status',a.status,'payment_status',a.payment_status,'customer',p.full_name,'phone',p.phone,
  'vehicle',trim(coalesce(v.make,'')||' '||coalesce(v.model,'')||' '||coalesce(v.plate_number,'')),'service',a.service_name_snapshot,'mechanic',w.full_name,'start_at',a.start_at,'end_at',a.end_at) into r
 from appointments a join profiles p on p.id=a.customer_id left join vehicles v on v.id=a.vehicle_id left join workers w on w.id=a.worker_id
 where a.qr_token=p_token or a.reference=upper(p_token);
 if r is null then raise exception 'Invalid QR code or reference';end if;return r;end $$;

create or replace function public.admin_set_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_admin() then raise exception 'Admin only';end if;
 if p_status not in('confirmed','checked_in','in_progress','completed','cancelled','no_show') then raise exception 'Bad status';end if;
 update appointments set status=p_status where id=p_id;
 insert into audit_logs(actor,action,record_type,record_id) values(auth.uid(),'status:'||p_status,'appointment',p_id::text);end $$;

create or replace function public.admin_mark_paid(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_admin() then raise exception 'Admin only';end if;
 update appointments set payment_status='paid_at_shop',amount_paid=amount_due where id=p_id;
 insert into audit_logs(actor,action,record_type,record_id) values(auth.uid(),'paid_at_shop','appointment',p_id::text);end $$;

create or replace function public.cancel_my_appointment(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 update appointments set status='cancelled' where id=p_id and customer_id=auth.uid() and status='confirmed' and start_at>now();
 if not found then raise exception 'Cannot cancel this appointment';end if;end $$;
grant execute on function public.verify_qr(text),public.admin_set_status(uuid,text),public.admin_mark_paid(uuid),public.cancel_my_appointment(uuid),public.book_appointment(uuid,uuid,uuid,timestamptz) to authenticated;
