-- Adds per-account Google Fonts imports for RawType.
-- Run once on databases created before custom font imports were added.

begin;

create extension if not exists pgcrypto;

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

alter table public.user_settings
  drop constraint if exists user_settings_app_font_valid,
  drop constraint if exists user_settings_text_font_valid;

alter table public.user_settings
  add constraint user_settings_app_font_valid check (
    app_font in ('system-sans', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans')
      or app_font ~ '^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  add constraint user_settings_text_font_valid check (
    text_font in ('system-mono', 'system-sans', 'serif', 'libre-baskerville', 'smooch-sans', 'manrope', 'nunito-sans', 'sekuya')
      or text_font ~ '^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );

alter table public.custom_fonts enable row level security;

drop policy if exists "custom fonts read own" on public.custom_fonts;
create policy "custom fonts read own" on public.custom_fonts
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "custom fonts insert own" on public.custom_fonts;
create policy "custom fonts insert own" on public.custom_fonts
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "custom fonts delete own" on public.custom_fonts;
create policy "custom fonts delete own" on public.custom_fonts
for delete to authenticated using (auth.uid() = user_id);

grant select, insert, delete on public.custom_fonts to authenticated;

commit;
