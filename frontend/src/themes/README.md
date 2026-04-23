# Themes (Foundation)

This structure is intentionally kept simple so we can add many themes later without refactoring.

## Current Status

- `registry.ts`: central theme source of truth (IDs, colors, aliases, names/descriptions, lookup helpers)
- `types.ts`: manifest types for future uploads
- `customThemeUploader.ts`: placeholder for future upload logic
- `settings/preferences.ts`: reads theme variables only from `registry.ts`

## Add a New Built-in Theme

1. Add a new entry to `THEME_DEFINITIONS` in `registry.ts` (id, name, description, colors, optional aliases/localization).
2. Run `npm run build` and test in the theme window.

## Later: Upload Custom Themes

Planned direction:

- Upload provides a small package with `manifest` and optional assets.
- `manifest` contains name, version, source, and theme tokens.
- Validation happens in `customThemeUploader.ts` (`validateThemeManifest`).
- Registration/storage will be added later in `registerCustomTheme`.

## Recommended Upload Format (Later)

- A `theme.json` with:
  - `id`
  - `name`
  - `version`
  - `tokens` (colors for known CSS variables)
- Optional preview image for the selection UI.

Important: For the first version, allow only known tokens. This keeps third-party themes stable and prevents UI breakage.
