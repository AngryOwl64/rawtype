# Vibe coded Bullshit 
# RawType

RawType is a free single-player typing practice Plattform for improving WPM, CPM, accuracy, and consistency.

Website: https://rawtype.net/

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
