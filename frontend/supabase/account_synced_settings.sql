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
  add column if not exists show_error_breakdown boolean not null default true;

update public.user_settings
set theme = case theme
  when 'dark' then 'monokai'
  when 'light' then 'pergament'
  when 'system' then 'pergament'
  else theme
end;

alter table public.user_settings
  drop constraint if exists user_settings_theme_valid,
  drop constraint if exists user_settings_app_font_valid,
  drop constraint if exists user_settings_text_font_valid,
  drop constraint if exists user_settings_keyboard_layout_valid,
  drop constraint if exists user_settings_restart_key_valid,
  drop constraint if exists user_settings_correct_marker_color_valid,
  drop constraint if exists user_settings_error_marker_color_valid;

alter table public.user_settings
  add constraint user_settings_theme_valid check (theme in ('pergament', 'monokai', 'dracula')),
  add constraint user_settings_app_font_valid check (
    app_font in ('system-sans', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans')
  ),
  add constraint user_settings_text_font_valid check (
    text_font in ('system-mono', 'system-sans', 'serif', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans', 'sekuya')
  ),
  add constraint user_settings_keyboard_layout_valid check (
    on_screen_keyboard_layout in ('us-qwerty', 'uk-qwerty', 'de-qwertz', 'fr-azerty', 'es-qwerty')
  ),
  add constraint user_settings_restart_key_valid check (restart_key in ('Enter', 'Escape')),
  add constraint user_settings_correct_marker_color_valid check (correct_marker_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_settings_error_marker_color_valid check (error_marker_color ~ '^#[0-9A-Fa-f]{6}$');

commit;
