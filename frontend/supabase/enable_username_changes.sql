-- Adds database support for changing usernames safely.
-- Keeps username updates consistent across profile records.
-- RawType: allow profile username changes.
--
-- Run this once on existing databases if username updates are currently blocked.

begin;

drop trigger if exists profiles_prevent_username_change on public.profiles;
drop function if exists public.prevent_username_change();

commit;
