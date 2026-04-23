# RawType Frontend

This directory contains the React + TypeScript frontend for RawType.

## Structure

```text
src/
  App.tsx
  main.tsx
  lib/
    supabase.ts
    database.types.ts
  games/
    typing/
      components/
        TypingGame.tsx
      hooks/
        useTypingGame.ts
      services/
        sentenceTexts.ts
        textServiceUtils.ts
        texts.ts
        wordTexts.ts
      types.ts
supabase/
  texts.sql
  words.sql
public/
  favicon.ico
  favicon-96x96.png
  apple-touch-icon.png
  site.webmanifest
src/
  assets/
    branding/
      rawtype-logo-mark.png
```

## Notes

- Typing feature logic is split by responsibility:
  - `types.ts` for shared typing types
  - `hooks/` for state and keyboard logic
  - `services/` for Supabase text/word reads
  - `components/` for UI rendering
- Typing texts are loaded from Supabase (not from static local arrays):
  - `public.texts` for `Sentences`
  - `public.words` for `Words`
- Default text mode excludes code texts (`category != code`) and serves regular prose-like content.
- Available modes:
  - `Sentences`: random normal text from DB
  - `Words`: generated random words (count selectable in Start Menu)
- Text fetching uses a local in-memory batch cache with prefetch to reduce unnecessary DB reads.
- Removed duplicate utility files and empty placeholder files to keep the project easier to navigate.

## Supabase Setup

1. Fill `frontend/.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Run the SQL in `supabase/texts.sql` (if you have not already created the `texts` table and read policy).
3. Run the SQL in `supabase/words.sql` (for the dedicated word pool table).
4. Ensure `public.texts` has rows with `content`, `language`, `category`, and `difficulty`.
5. Ensure `public.words` has rows with `word` and `language`.

## SEO Setup

Set `VITE_SITE_URL` to the public production origin before deploying, for example
`https://rawtype.example`. The build uses it to generate `sitemap.xml`, add the sitemap entry
to `robots.txt`, and inject the canonical URL into `index.html`.
