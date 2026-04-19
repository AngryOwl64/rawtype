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
        texts.ts
        typingRuns.ts
      types.ts
supabase/
  typing_runs.sql
public/
  favicon.svg
  icons.svg
```

## Notes

- Typing feature logic is split by responsibility:
  - `types.ts` for shared typing types
  - `hooks/` for state and keyboard logic
  - `services/` for Supabase reads/writes
  - `components/` for UI rendering
- Typing texts are loaded from the `public.texts` table in Supabase (not from static local arrays).
- Default text mode excludes code texts (`category != code`) and serves regular prose-like content.
- Text fetching uses a local in-memory batch cache with prefetch to reduce unnecessary DB reads.
- Removed duplicate utility files and empty placeholder files to keep the project easier to navigate.

## Supabase Setup

1. Fill `frontend/.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Run the SQL in `supabase/typing_runs.sql` in the Supabase SQL editor.
3. Run the SQL in `supabase/texts.sql` (if you have not already created the `texts` table and read policy).
4. Ensure `public.texts` has rows with `content`, `language`, `category`, and `difficulty`.
5. Finished runs are saved automatically into `public.typing_runs`.
