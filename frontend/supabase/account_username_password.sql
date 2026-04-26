-- Creates account username/password support for RawType auth.
-- Adds the database pieces needed by the custom login flow.
-- RawType: email + password auth with separate username profile.
--
-- This is a setup/reset script for the RawType account + stats tables.
-- It drops and recreates:
--   profiles, user_settings, custom_fonts, typing_runs, typing_errors
--
-- Do not run this on production data you want to keep.
--
-- Login accepts email or username in the app.
-- Username is stored in public.profiles and can be changed independently.

begin;

create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created_create_rawtype_account on auth.users;

drop view if exists public.my_best_runs;
drop view if exists public.my_worst_words;
drop view if exists public.my_recent_typing_runs;
drop view if exists public.my_typing_summary;

drop table if exists public.typing_errors;
drop table if exists public.typing_runs;
drop table if exists public.custom_fonts;
drop table if exists public.user_settings;
drop table if exists public.profiles;

create or replace function public.normalize_username(value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(value, '')));
$$;

create or replace function public.is_valid_username(value text)
returns boolean
language sql
immutable
as $$
  select public.normalize_username(value) ~ '^[a-z0-9_]{3,20}$'
    and public.normalize_username(value) not in (
      'admin', 'api', 'auth', 'guest', 'login', 'logout', 'me',
      'profile', 'rawtype', 'root', 'settings', 'stats', 'support',
      'system', 'user', 'username'
    );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  public_profile boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_valid check (public.is_valid_username(username)),
  constraint profiles_avatar_url_valid check (
    avatar_url is null or char_length(avatar_url) <= 500
  )
);

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.is_username_available(value text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_valid_username(value)
    and not exists (
      select 1
      from public.profiles
      where lower(username) = public.normalize_username(value)
    );
$$;

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

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'pergament',
  language text not null default 'en',
  default_typing_mode text not null default 'sentences',
  default_words_count integer not null default 25,
  default_word_difficulty text not null default 'mixed',
  default_no_mistake boolean not null default false,
  app_font text not null default 'system-sans',
  text_font text not null default 'system-mono',
  highlight_correct_words boolean not null default true,
  highlight_error_from_point boolean not null default true,
  show_on_screen_keyboard boolean not null default false,
  on_screen_keyboard_layout text not null default 'us-qwerty',
  restart_key text not null default 'Enter',
  correct_marker_color text not null default '#6fbf73',
  error_marker_color text not null default '#c86b73',
  save_runs_to_account boolean not null default true,
  save_error_words boolean not null default true,
  show_error_breakdown boolean not null default true,
  animation_intensity text not null default 'balanced',
  caret_animation text not null default 'blink',
  caret_movement_animation text not null default 'slide',
  typing_feedback_animation text not null default 'lift',
  error_feedback_animation text not null default 'shake',
  keyboard_animation text not null default 'press',
  completion_animation text not null default 'confetti',
  animation_respect_reduced_motion boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_settings_theme_valid check (theme in ('pergament', 'monokai', 'dracula')),
  constraint user_settings_language_valid check (language in ('en', 'de')),
  constraint user_settings_mode_valid check (default_typing_mode in ('sentences', 'words')),
  constraint user_settings_words_valid check (default_words_count in (10, 25, 50, 75)),
  constraint user_settings_difficulty_valid check (
    default_word_difficulty in ('easy', 'medium', 'hard', 'mixed')
  ),
  constraint user_settings_app_font_valid check (
    app_font in ('system-sans', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans')
      or app_font ~ '^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  constraint user_settings_text_font_valid check (
    text_font in ('system-mono', 'system-sans', 'serif', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans', 'sekuya')
      or text_font ~ '^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  constraint user_settings_keyboard_layout_valid check (
    on_screen_keyboard_layout in ('us-qwerty', 'uk-qwerty', 'de-qwertz', 'fr-azerty', 'es-qwerty')
  ),
  constraint user_settings_restart_key_valid check (restart_key in ('Enter', 'Escape')),
  constraint user_settings_correct_marker_color_valid check (correct_marker_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_settings_error_marker_color_valid check (error_marker_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_settings_animation_intensity_valid check (
    animation_intensity in ('off', 'calm', 'balanced', 'expressive')
  ),
  constraint user_settings_caret_animation_valid check (
    caret_animation in ('steady', 'blink', 'glow', 'block', 'underline')
  ),
  constraint user_settings_caret_movement_animation_valid check (
    caret_movement_animation in ('instant', 'slide')
  ),
  constraint user_settings_typing_feedback_animation_valid check (
    typing_feedback_animation in ('none', 'lift', 'pop', 'wave', 'ink')
  ),
  constraint user_settings_error_feedback_animation_valid check (
    error_feedback_animation in ('none', 'shake', 'flash', 'snap', 'glitch')
  ),
  constraint user_settings_keyboard_animation_valid check (
    keyboard_animation in ('none', 'press', 'glow', 'ripple', 'tilt')
  ),
  constraint user_settings_completion_animation_valid check (
    completion_animation in ('none', 'pulse', 'confetti', 'sparkles', 'ribbons')
  )
);

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
before update on public.user_settings
for each row execute function public.touch_updated_at();

create table if not exists public.custom_fonts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  family_name text not null,
  css_url text not null,
  source text not null default 'google',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint custom_fonts_source_valid check (source = 'google'),
  constraint custom_fonts_family_name_valid check (
    family_name ~ '^[A-Za-z0-9 ._-]{1,80}$'
  ),
  constraint custom_fonts_css_url_valid check (
    css_url ~ '^https://fonts\.googleapis\.com/css2\?'
      and char_length(css_url) <= 500
      and css_url !~ '[<>"'';{}]'
  )
);

create unique index if not exists custom_fonts_user_css_url_unique
  on public.custom_fonts (user_id, css_url);

drop trigger if exists custom_fonts_touch_updated_at on public.custom_fonts;
create trigger custom_fonts_touch_updated_at
before update on public.custom_fonts
for each row execute function public.touch_updated_at();

create table if not exists public.typing_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text_id uuid references public.texts(id) on delete set null,
  mode text not null,
  language text not null default 'en',
  difficulty text,
  words_count integer,
  no_mistake boolean not null default false,
  wpm integer not null,
  accuracy integer not null,
  duration_ms integer not null,
  typed_chars integer not null,
  correct_chars integer not null,
  mistakes integer not null,
  completed_words integer not null,
  total_words integer not null,
  failed_by_mistake boolean not null default false,
  created_at timestamptz not null default now(),

  constraint typing_runs_mode_valid check (mode in ('sentences', 'words')),
  constraint typing_runs_language_valid check (language in ('en', 'de')),
  constraint typing_runs_difficulty_valid check (
    difficulty is null or difficulty in ('easy', 'medium', 'hard', 'mixed')
  ),
  constraint typing_runs_wpm_valid check (wpm between 0 and 400),
  constraint typing_runs_accuracy_valid check (accuracy between 0 and 100),
  constraint typing_runs_counts_valid check (
    duration_ms >= 0 and typed_chars >= 0 and correct_chars >= 0
    and mistakes >= 0 and completed_words >= 0 and total_words > 0
    and correct_chars <= typed_chars and completed_words <= total_words
  )
);

create unique index if not exists typing_runs_id_user_id_unique
  on public.typing_runs (id, user_id);

create index if not exists typing_runs_user_created_at_idx
  on public.typing_runs (user_id, created_at desc);

create table if not exists public.typing_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  word text not null,
  word_number integer not null,
  char_position integer not null,
  expected text not null,
  typed text not null,
  created_at timestamptz not null default now(),

  constraint typing_errors_run_user_fk foreign key (run_id, user_id)
    references public.typing_runs (id, user_id) on delete cascade,
  constraint typing_errors_word_valid check (char_length(trim(word)) between 1 and 100),
  constraint typing_errors_position_valid check (word_number > 0 and char_position > 0),
  constraint typing_errors_chars_valid check (
    char_length(expected) between 1 and 20 and char_length(typed) between 1 and 20
  )
);

create index if not exists typing_errors_run_id_idx
  on public.typing_errors (run_id);

create index if not exists typing_errors_user_word_idx
  on public.typing_errors (user_id, lower(word));

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  chosen_username text;
begin
  chosen_username = public.normalize_username(new.raw_user_meta_data ->> 'username');

  if not public.is_valid_username(chosen_username) then
    chosen_username = split_part(lower(coalesce(new.email, '')), '@', 1);
  end if;

  if not public.is_valid_username(chosen_username) then
    raise exception 'Invalid RawType username.';
  end if;

  insert into public.profiles (user_id, username)
  values (new.id, chosen_username)
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_rawtype_account on auth.users;
create trigger on_auth_user_created_create_rawtype_account
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill profiles/settings for accounts that already existed before this script ran.
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

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.custom_fonts enable row level security;
alter table public.typing_runs enable row level security;
alter table public.typing_errors enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "profiles read public" on public.profiles;
create policy "profiles read public" on public.profiles
for select to anon, authenticated using (public_profile = true);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "settings read own" on public.user_settings;
create policy "settings read own" on public.user_settings
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "settings update own" on public.user_settings;
create policy "settings update own" on public.user_settings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "custom fonts read own" on public.custom_fonts;
create policy "custom fonts read own" on public.custom_fonts
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "custom fonts insert own" on public.custom_fonts;
create policy "custom fonts insert own" on public.custom_fonts
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "custom fonts delete own" on public.custom_fonts;
create policy "custom fonts delete own" on public.custom_fonts
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "runs read own" on public.typing_runs;
create policy "runs read own" on public.typing_runs
for select to authenticated using (auth.uid() = user_id);

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

drop policy if exists "runs insert own" on public.typing_runs;
create policy "runs insert own" on public.typing_runs
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "runs delete own" on public.typing_runs;
create policy "runs delete own" on public.typing_runs
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "errors read own" on public.typing_errors;
create policy "errors read own" on public.typing_errors
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "errors insert own" on public.typing_errors;
create policy "errors insert own" on public.typing_errors
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "errors delete own" on public.typing_errors;
create policy "errors delete own" on public.typing_errors
for delete to authenticated using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant execute on function public.normalize_username(text) to anon, authenticated;
grant execute on function public.is_valid_username(text) to anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.get_auth_email_for_username(text) to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant select, update on public.user_settings to authenticated;
grant select, insert, delete on public.custom_fonts to authenticated;
grant select on public.typing_runs to anon, authenticated;
grant insert, delete on public.typing_runs to authenticated;
grant select, insert, delete on public.typing_errors to authenticated;

commit;
