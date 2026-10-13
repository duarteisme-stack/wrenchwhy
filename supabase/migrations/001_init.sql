create extension if not exists btree_gist; create extension if not exists pgcrypto;

create table profiles(id uuid primary key references auth.users on delete cascade,full_name text not null,phone text,email text,
 role text not null default 'customer' check(role in('admin','customer')),
 approval_status text not null default 'pending' check(approval_status in('pending','approved','rejected','suspended')),
 created_at timestamptz default now());
create function is_admin() returns boolean language sql security definer stable as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;
create function is_approved() returns boolean language sql security definer stable as $$select exists(select 1 from profiles where id=auth.uid() and approval_status='approved')$$;
-- New sign-ups are ALWAYS customer + pending, whatever the client sends.
create function handle_new_user() returns trigger language plpgsql security definer as $$begin
 insert into profiles(id,full_name,phone,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone',new.email);return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table services(id uuid primary key default gen_random_uuid(),name text not null,description text,image_url text,price numeric(10,2) not null,
 duration_minutes int not null check(duration_minutes>0),pricing_type text default 'fixed',active boolean default true,created_at timestamptz default now());
create table workers(id uuid primary key default gen_random_uuid(),full_name text not null,photo_url text,specialties text[] default '{}',
 qualified_service_ids uuid[] default '{}',working_schedule jsonb default '{}',internal_notes text,active boolean default true,created_at timestamptz default now());
create table vehicles(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),make text,model text,year int,plate_number text,mileage int,notes text,created_at timestamptz default now());
create table appointments(id uuid primary key default gen_random_uuid(),reference text unique not null,customer_id uuid not null references profiles(id),vehicle_id uuid references vehicles(id),
 service_id uuid references services(id),service_name_snapshot text,price_snapshot numeric(10,2),duration_snapshot int,worker_id uuid references workers(id),
 during tstzrange not null,status text not null default 'awaiting_payment',payment_status text not null default 'unpaid',amount_due numeric(10,2),amount_paid numeric(10,2) default 0,
 hold_expires_at timestamptz,qr_token_hash text,created_at timestamptz default now(),
 constraint no_double_booking exclude using gist(worker_id with =,during with &&) where(status in('awaiting_payment','confirmed','checked_in','in_progress')));
create table audit_logs(id bigserial primary key,actor uuid,action text,record_type text,record_id text,created_at timestamptz default now());
create table shop_settings(id int primary key default 1 check(id=1),data jsonb default '{}');

alter table profiles enable row level security;alter table services enable row level security;alter table workers enable row level security;
alter table vehicles enable row level security;alter table appointments enable row level security;alter table audit_logs enable row level security;alter table shop_settings enable row level security;
create policy p_sel on profiles for select using(id=auth.uid() or is_admin());
create policy p_adm on profiles for update using(is_admin());  -- customers cannot update profiles (no role/approval edits)
create policy s_sel on services for select using(active or is_admin());create policy s_adm on services for all using(is_admin());
create policy w_sel on workers for select using(is_admin() or (is_approved() and active));create policy w_adm on workers for all using(is_admin());
create policy v_own on vehicles for all using(owner_id=auth.uid() or is_admin()) with check((owner_id=auth.uid() and is_approved()) or is_admin());
create policy a_sel on appointments for select using(customer_id=auth.uid() or is_admin());  -- writes only via functions
create policy l_sel on audit_logs for select using(is_admin());
create policy ss_sel on shop_settings for select using(true);create policy ss_adm on shop_settings for all using(is_admin());

-- Customers cannot read private worker notes through the table policy only if you expose a view; see README TODO.

create function set_approval(uid uuid,new_status text) returns void language plpgsql security definer as $$begin
 if not is_admin() then raise exception 'Admin only';end if;
 if new_status not in('approved','rejected','suspended') then raise exception 'Bad status';end if;
 update profiles set approval_status=new_status where id=uid;
 insert into audit_logs(actor,action,record_type,record_id) values(auth.uid(),'approval:'||new_status,'profile',uid::text);end$$;

-- Atomic booking. The exclusion constraint makes double-booking impossible even under simultaneous requests.
create function book_appointment(p_service uuid,p_vehicle uuid,p_worker uuid,p_start timestamptz) returns json language plpgsql security definer as $$
declare s services;w workers;v vehicles;tok text;aid uuid:=gen_random_uuid();begin
 if auth.uid() is null then raise exception 'Login required';end if;
 if not is_approved() then raise exception 'Account not approved';end if;
 select * into s from services where id=p_service and active;if not found then raise exception 'Service unavailable';end if;
 select * into w from workers where id=p_worker and active;if not found or not(p_service=any(w.qualified_service_ids)) then raise exception 'Mechanic not eligible';end if;
 select * into v from vehicles where id=p_vehicle and owner_id=auth.uid();if not found then raise exception 'Not your vehicle';end if;
 if p_start<now() then raise exception 'Time is in the past';end if;
 -- release expired holds first
 update appointments set status='expired' where status='awaiting_payment' and hold_expires_at<now();
 -- TODO: validate shop hours, worker shift/breaks/leave, holidays, buffer, capacity.
 tok:=encode(gen_random_bytes(24),'hex');
 begin
  insert into appointments(id,reference,customer_id,vehicle_id,service_id,service_name_snapshot,price_snapshot,duration_snapshot,worker_id,during,amount_due,hold_expires_at,qr_token_hash)
  values(aid,'WW-'||upper(substr(aid::text,1,8)),auth.uid(),p_vehicle,p_service,s.name,s.price,s.duration_minutes,p_worker,tstzrange(p_start,p_start+make_interval(mins=>s.duration_minutes)),s.price,now()+interval '15 minutes',encode(digest(tok,'sha256'),'hex'));
 exception when exclusion_violation then raise exception 'Slot taken';end;
 return json_build_object('appointment_id',aid,'qr_token',tok);end$$;
grant execute on function book_appointment,set_approval to authenticated;
