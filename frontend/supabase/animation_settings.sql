-- Adds account-synced animation preference columns to existing RawType user_settings rows.
-- Run this once on databases created before animation settings were added.

begin;

alter table public.user_settings
  add column if not exists animation_intensity text not null default 'balanced',
  add column if not exists caret_animation text not null default 'blink',
  add column if not exists caret_movement_animation text not null default 'slide',
  add column if not exists typing_feedback_animation text not null default 'lift',
  add column if not exists error_feedback_animation text not null default 'shake',
  add column if not exists keyboard_animation text not null default 'press',
  add column if not exists completion_animation text not null default 'confetti',
  add column if not exists animation_respect_reduced_motion boolean not null default true;

update public.user_settings
set caret_animation = 'blink'
where caret_animation = 'fixed';

alter table public.user_settings
  drop constraint if exists user_settings_animation_intensity_valid,
  drop constraint if exists user_settings_caret_animation_valid,
  drop constraint if exists user_settings_caret_movement_animation_valid,
  drop constraint if exists user_settings_typing_feedback_animation_valid,
  drop constraint if exists user_settings_error_feedback_animation_valid,
  drop constraint if exists user_settings_keyboard_animation_valid,
  drop constraint if exists user_settings_completion_animation_valid;

alter table public.user_settings
  add constraint user_settings_animation_intensity_valid check (
    animation_intensity in ('off', 'calm', 'balanced', 'expressive')
  ),
  add constraint user_settings_caret_animation_valid check (
    caret_animation in ('steady', 'blink', 'glow', 'block', 'underline')
  ),
  add constraint user_settings_caret_movement_animation_valid check (
    caret_movement_animation in ('instant', 'slide')
  ),
  add constraint user_settings_typing_feedback_animation_valid check (
    typing_feedback_animation in ('none', 'lift', 'pop', 'wave', 'ink')
  ),
  add constraint user_settings_error_feedback_animation_valid check (
    error_feedback_animation in ('none', 'shake', 'flash', 'snap', 'glitch')
  ),
  add constraint user_settings_keyboard_animation_valid check (
    keyboard_animation in ('none', 'press', 'glow', 'ripple', 'tilt')
  ),
  add constraint user_settings_completion_animation_valid check (
    completion_animation in ('none', 'pulse', 'confetti', 'sparkles', 'ribbons')
  );

commit;
