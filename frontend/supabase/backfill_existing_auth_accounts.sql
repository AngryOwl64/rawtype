-- RawType: backfill profile and settings rows for already-existing auth users.
--
-- Run this once if account_username_password.sql was applied after users already
-- existed in auth.users, and account actions like "Make Profile Public" fail.

begin;

insert into public.profiles (user_id, username)
select
  users.id,
  case
    when public.is_valid_username(public.normalize_username(users.raw_user_meta_data ->> 'username'))
      then public.normalize_username(users.raw_user_meta_data ->> 'username')
    else split_part(lower(coalesce(users.email, '')), '@', 1)
  end
from auth.users
where not exists (
  select 1
  from public.profiles
  where profiles.user_id = users.id
)
and (
  public.is_valid_username(public.normalize_username(users.raw_user_meta_data ->> 'username'))
  or public.is_valid_username(split_part(lower(coalesce(users.email, '')), '@', 1))
);

insert into public.user_settings (user_id)
select users.id
from auth.users
where not exists (
  select 1
  from public.user_settings
  where user_settings.user_id = users.id
);

commit;
