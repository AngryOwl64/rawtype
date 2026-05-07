# RawType

RawType is a free single-player typing test and typing practice game for improving WPM, CPM, accuracy, and consistency.

Live app: https://rawtype.net/

## Features

- Typing Classic for prose-like text, punctuation, capitalization, and sentence flow
- Word Mode for random word typing drills
- Custom Mode with configurable focus, casing, rhythm, symbols, and pinned words
- Selectable word count and difficulty, plus No Mistake Mode for stricter accuracy practice
- WPM, CPM, accuracy, progress, mistakes, duration, and completed-word metrics
- Optional account features: saved runs, stats dashboard, streaks, daily activity, recurring mistake words, and public profiles
- English and German typing practice
- Theme, font (including Google Fonts import), keyboard, privacy, and animation preferences
- Localized SEO landing pages generated at build time

## SEO Entry Points

- https://rawtype.net/typing-test/
- https://rawtype.net/typing-practice/
- https://rawtype.net/wpm-test/
- https://rawtype.net/word-mode/
- https://rawtype.net/de/
- https://rawtype.net/de/tipptraining/
- https://rawtype.net/de/tipptrainer/
- https://rawtype.net/de/tippgeschwindigkeit-test/

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Supabase (Auth + Postgres)
- Cloudflare Workers + Wrangler (`@cloudflare/vite-plugin`)
- ESLint

## Local Development

```bash
cd frontend
npm install
npm run dev
```

For Supabase-backed text and account features, copy `frontend/.env.example` to `frontend/.env.local` and add the required public Supabase values.
