# RawType

RawType is a free single-player typing test and typing practice game for improving WPM, CPM, accuracy, and consistency.

Live app: https://rawtype.net/

## Features

- Typing Classic for prose-like text, punctuation, capitalization, and sentence flow
- Word Mode for random word typing drills
- Selectable word count and difficulty
- No Mistake Mode for stricter accuracy practice
- WPM, CPM, accuracy, progress, mistakes, duration, and completed-word metrics
- Optional account stats, streaks, recent runs, and recurring mistake words
- English and German typing practice
- Theme, font, keyboard, privacy, and animation preferences

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

- React
- TypeScript
- Vite
- Supabase
- Cloudflare Workers / Wrangler

## Local Development

```bash
cd frontend
npm install
npm run dev
```

For Supabase-backed text and account features, copy `frontend/.env.example` to `frontend/.env.local` and add the required public Supabase values.
