-- Adds the account-synced metric value animation setting.
-- Run this once on databases created before metric value animations were added.

begin;

alter table public.user_settings
  add column if not exists metric_value_animation text not null default 'roll-up';

alter table public.user_settings
  drop constraint if exists user_settings_metric_value_animation_valid;

alter table public.user_settings
  add constraint user_settings_metric_value_animation_valid check (
    metric_value_animation in ('none', 'roll-up', 'slide-side', 'flip')
  );

commit;
