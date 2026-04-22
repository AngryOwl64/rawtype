-- Defines public profile data exposed to the frontend.
-- Keeps display names separate from private auth details.
-- RawType: add public profile visibility to an existing database.
--
-- Run this once if you already applied account_username_password.sql before
-- public profiles existed. New reset installs include these changes directly.

begin;

alter table public.profiles
  add column if not exists public_profile boolean not null default false;

drop policy if exists "profiles read public" on public.profiles;
create policy "profiles read public" on public.profiles
for select to anon, authenticated using (public_profile = true);

drop policy if exists "runs read public profile" on public.typing_runs;
create policy "runs read public profile" on public.typing_runs
for select to anon, authenticated using (
  exists (
    select 1
    from public.profiles
    where profiles.user_id = typing_runs.user_id
      and profiles.public_profile = true
  )
);

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant select on public.typing_runs to anon, authenticated;
grant insert, delete on public.typing_runs to authenticated;

commit;
