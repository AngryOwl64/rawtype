create table if not exists public.texts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  category text not null,
  difficulty text not null,
  language text not null default 'en',
  word_count integer not null default 0,
  source text null,
  created_at timestamptz not null default now()
);

create index if not exists texts_language_idx on public.texts (language);
create index if not exists texts_difficulty_idx on public.texts (difficulty);
create index if not exists texts_category_idx on public.texts (category);

alter table public.texts enable row level security;

drop policy if exists "public can read texts" on public.texts;
create policy "public can read texts"
  on public.texts
  for select
  using (true);
