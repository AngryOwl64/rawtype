-- Allows the generated custom mode in account defaults and saved run history.
-- Run this once on databases created before custom mode was added.

begin;

alter table public.user_settings
  drop constraint if exists user_settings_mode_valid;

alter table public.user_settings
  add constraint user_settings_mode_valid check (default_typing_mode in ('sentences', 'words', 'custom'));

alter table public.typing_runs
  drop constraint if exists typing_runs_mode_valid;

alter table public.typing_runs
  add constraint typing_runs_mode_valid check (mode in ('sentences', 'words', 'custom'));

commit;
