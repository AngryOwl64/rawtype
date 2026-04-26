-- Adds account-synced preference columns to existing RawType user_settings rows.
-- Run this once on databases created before account-level settings were added.

begin;

alter table public.user_settings
  add column if not exists app_font text not null default 'system-sans',
  add column if not exists text_font text not null default 'system-mono',
  add column if not exists highlight_correct_words boolean not null default true,
  add column if not exists highlight_error_from_point boolean not null default true,
  add column if not exists show_on_screen_keyboard boolean not null default false,
  add column if not exists on_screen_keyboard_layout text not null default 'us-qwerty',
  add column if not exists restart_key text not null default 'Enter',
  add column if not exists correct_marker_color text not null default '#6fbf73',
  add column if not exists error_marker_color text not null default '#c86b73',
  add column if not exists save_runs_to_account boolean not null default true,
  add column if not exists save_error_words boolean not null default true,
  add column if not exists show_error_breakdown boolean not null default true,
  add column if not exists animation_intensity text not null default 'balanced',
  add column if not exists caret_animation text not null default 'blink',
  add column if not exists caret_movement_animation text not null default 'slide',
  add column if not exists typing_feedback_animation text not null default 'lift',
  add column if not exists error_feedback_animation text not null default 'shake',
  add column if not exists keyboard_animation text not null default 'press',
  add column if not exists completion_animation text not null default 'confetti',
  add column if not exists animation_respect_reduced_motion boolean not null default true;

update public.user_settings
set theme = case theme
  when 'dark' then 'monokai'
  when 'light' then 'pergament'
  when 'system' then 'pergament'
  else theme
end;

update public.user_settings
set caret_animation = 'blink'
where caret_animation = 'fixed';

alter table public.user_settings
  drop constraint if exists user_settings_theme_valid,
  drop constraint if exists user_settings_app_font_valid,
  drop constraint if exists user_settings_text_font_valid,
  drop constraint if exists user_settings_keyboard_layout_valid,
  drop constraint if exists user_settings_restart_key_valid,
  drop constraint if exists user_settings_correct_marker_color_valid,
  drop constraint if exists user_settings_error_marker_color_valid,
  drop constraint if exists user_settings_animation_intensity_valid,
  drop constraint if exists user_settings_caret_animation_valid,
  drop constraint if exists user_settings_caret_movement_animation_valid,
  drop constraint if exists user_settings_typing_feedback_animation_valid,
  drop constraint if exists user_settings_error_feedback_animation_valid,
  drop constraint if exists user_settings_keyboard_animation_valid,
  drop constraint if exists user_settings_completion_animation_valid;

alter table public.user_settings
  add constraint user_settings_theme_valid check (theme in ('pergament', 'monokai', 'dracula')),
  add constraint user_settings_app_font_valid check (
    app_font in ('system-sans', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans')
      or app_font ~ '^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  add constraint user_settings_text_font_valid check (
    text_font in ('system-mono', 'system-sans', 'serif', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans', 'sekuya')
      or text_font ~ '^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  add constraint user_settings_keyboard_layout_valid check (
    on_screen_keyboard_layout in ('us-qwerty', 'uk-qwerty', 'de-qwertz', 'fr-azerty', 'es-qwerty')
  ),
  add constraint user_settings_restart_key_valid check (restart_key in ('Enter', 'Escape')),
  add constraint user_settings_correct_marker_color_valid check (correct_marker_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_settings_error_marker_color_valid check (error_marker_color ~ '^#[0-9A-Fa-f]{6}$'),
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
