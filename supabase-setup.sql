-- =====================================================================
-- Worn: Supabase database setup
-- Run this once in your Supabase project: SQL Editor -> New query ->
-- paste this whole file -> Run.
--
-- It creates:
--   1. A "profiles" table for each user's name, fit, height and weight
--   2. Row-level security so every user can only see/change THEIR OWN row
--   3. A trigger that creates the profile automatically at sign-up
--   4. A PRIVATE storage bucket for body photos, where each user can only
--      read/write files inside their own folder
-- =====================================================================

-- 1. Profiles table ----------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  first_name    text,
  last_name     text,
  preferred_fit text,
  height_ft     smallint check (height_ft between 3 and 8),
  height_in     smallint check (height_in between 0 and 11),
  weight_lb     smallint check (weight_lb between 50 and 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Row-level security: users only ever touch their own row -----------
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Keep updated_at current
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 3. Create a profile automatically when someone signs up --------------
-- (Uses the name and fit sent from the Get Started form.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, preferred_fit)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'preferred_fit'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Private storage for body photos -----------------------------------
-- public = false means photos are never reachable by a plain URL.
-- Files are saved as  body-photos/<user id>/<file name>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('body-photos', 'body-photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "Users can view their own photos" on storage.objects;
create policy "Users can view their own photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'body-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can upload their own photos" on storage.objects;
create policy "Users can upload their own photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'body-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can replace their own photos" on storage.objects;
create policy "Users can replace their own photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'body-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their own photos" on storage.objects;
create policy "Users can delete their own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'body-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
