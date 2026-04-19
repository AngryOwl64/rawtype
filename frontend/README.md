# RawType Frontend

This directory contains the React + TypeScript frontend for RawType.

## Structure

```text
src/
  App.tsx
  main.tsx
  games/
    typing/
      components/
        TypingGame.tsx
      hooks/
        useTypingGame.ts
      data/
        texts.ts
      types.ts
public/
  favicon.svg
  icons.svg
```

## Notes

- Typing feature logic is split by responsibility:
  - `data/` for static text data
  - `types.ts` for shared typing types
  - `hooks/` for state and keyboard logic
  - `components/` for UI rendering
- Removed duplicate utility files and empty placeholder files to keep the project easier to navigate.
