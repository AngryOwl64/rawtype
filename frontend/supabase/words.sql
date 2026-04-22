-- Creates and seeds word data used by word typing mode.
-- Stores difficulty and language metadata for prompts.
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  language text not null default 'en',
  difficulty text null,
  category text null,
  created_at timestamptz not null default now()
);

create unique index if not exists words_language_word_unique_idx
  on public.words (language, lower(word));

create index if not exists words_language_idx on public.words (language);

alter table public.words enable row level security;

drop policy if exists "public can read words" on public.words;
create policy "public can read words"
  on public.words
  for select
  using (true);
