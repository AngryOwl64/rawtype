-- Adds display-only username fields for public profiles.
-- Lets the UI show names without changing login behavior.
-- RawType: make profile display names use username only.
--
-- Run this once on existing databases if you previously had editable display
-- names. New reset installs use username-only display names directly.

begin;

drop trigger if exists profiles_limit_display_name_changes on public.profiles;
drop function if exists public.limit_display_name_changes();

alter table public.profiles
  drop column if exists display_name_changed_at,
  drop column if exists display_name;

commit;
