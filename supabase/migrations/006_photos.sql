alter table profiles add column if not exists photo_url text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',true,1000000,array['image/jpeg'])
 on conflict (id) do update set file_size_limit=1000000,allowed_mime_types=array['image/jpeg'];
drop policy if exists avatar_sel on storage.objects;drop policy if exists avatar_ins on storage.objects;drop policy if exists avatar_upd on storage.objects;drop policy if exists avatar_del on storage.objects;
create policy avatar_sel on storage.objects for select using(bucket_id='avatars');
create policy avatar_ins on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_upd on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_del on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create or replace function public.set_my_photo(p_url text) returns void language plpgsql security definer set search_path=public as $$
begin if auth.uid() is null then raise exception 'Login required';end if;update profiles set photo_url=p_url where id=auth.uid();end $$;
grant execute on function public.set_my_photo(text) to authenticated;
