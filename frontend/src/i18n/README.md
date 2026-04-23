# i18n Guide

This folder contains the app's language helpers and message dictionaries.

## Current Structure

- `language.ts`: language resolution, supported language list, locale mapping, path/localStorage helpers
- `messages.ts`: UI text dictionaries and translation helpers

## Conventions

- English (`en`) is the source language and fallback.
- Keep message keys stable across languages.
- When adding a new language, add it everywhere in one pass before shipping.

## Add a New Language

Use this checklist when adding a new language (example: `fr`):

1. Extend language types in `src/games/typing/types.ts`.
   - Add `fr` to `TypingLanguage`.

2. Register language support in `src/i18n/language.ts`.
   - Add `fr` to `SUPPORTED_TYPING_LANGUAGES`.
   - Extend `getLocaleForLanguage` with `fr-FR` (or the locale you need).

3. Add UI dictionaries in `src/i18n/messages.ts`.
   - Add `fr` blocks to:
     - `APP_TEXTS`
     - `SETTINGS_TEXTS`
     - `TYPING_GAME_TEXTS`
     - `STATS_TEXTS`
     - `TYPING_SERVICE_MESSAGES`
     - `USERNAME_VALIDATION_MESSAGES`
     - `LANGUAGE_LABELS`

4. Extend account/auth translators in `src/i18n/messages.ts`.
   - The current implementation is language-specific for German (`DE_ACCOUNT_TRANSLATIONS`, `DE_AUTH_TRANSLATIONS`).
   - For a new language, add corresponding translation maps and update:
     - `translateAccountText(...)`
     - `translateAuthText(...)`
   - Recommended pattern: switch by resolved language and fallback to English.

5. Update language options in `src/i18n/messages.ts`.
   - Ensure `getLanguageOptionsFromMessages()` includes the new language.

6. Verify route behavior in `src/App.tsx`.
   - If you use path-based language prefixes (`/<lang>/...`), make sure route parsing handles the new language consistently.

## Validation Checklist

- `npm run build` succeeds.
- Language can be selected in Settings.
- `rawtype-language` in localStorage stores the new code.
- UI text appears translated on Games, Stats, Settings, and Account screens.
- Fallback to English still works for missing keys.
