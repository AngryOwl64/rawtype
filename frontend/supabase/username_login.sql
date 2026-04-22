-- RawType: allow password login with either username or email.
--
-- Run this once on existing databases after account_username_password.sql.
-- New setup/reset installs already include this function.

begin;

create or replace function public.get_auth_email_for_username(value text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select users.email
  from public.profiles
  join auth.users as users on users.id = profiles.user_id
  where public.is_valid_username(value)
    and lower(profiles.username) = public.normalize_username(value)
  limit 1;
$$;

grant execute on function public.get_auth_email_for_username(text) to anon, authenticated;

commit;
