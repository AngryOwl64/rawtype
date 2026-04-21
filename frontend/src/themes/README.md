# Themes (Grundgeruest)

Diese Struktur ist absichtlich einfach gehalten, damit wir spaeter ohne Umbau viele Themes ergaenzen koennen.

## Aktueller Stand

- `types.ts`: zentrale Typen (`ThemeId`, Manifest-Typen fuer Uploads)
- `registry.ts`: Built-in Themes, die im Theme-Fenster angezeigt werden
- `customThemeUploader.ts`: Platzhalter fuer spaetere Upload-Logik
- `settings/preferences.ts`: CSS-Variablen pro Theme

## Neues Built-in Theme hinzufuegen

1. In `types.ts` den neuen Key in `ThemeId` aufnehmen.
2. In `registry.ts` einen neuen Eintrag in `BUILT_IN_THEMES` anlegen (Name, Beschreibung, Swatches).
3. In `settings/preferences.ts` die Farbwerte in `getThemeVariables` hinterlegen.
4. Kurz `npm run build` ausfuehren und im Theme-Fenster testen.

## Spaeter: Eigene Themes hochladen

Geplante Richtung:

- Upload liefert ein kleines Paket mit `manifest` und optionalen Assets.
- `manifest` enthaelt Name, Version, Source und Theme-Tokens.
- Validierung passiert in `customThemeUploader.ts` (`validateThemeManifest`).
- Registrierung/ Speicherung kommt spaeter in `registerCustomTheme`.

## Empfohlenes Upload-Format (spaeter)

- Eine `theme.json` mit:
  - `id`
  - `name`
  - `version`
  - `tokens` (Farben fuer bekannte CSS-Variablen)
- Optional Preview-Bild fuer die Auswahlansicht.

Wichtig: Fuer den Anfang nur bekannte Tokens erlauben. So bleiben Fremd-Themes stabil und koennen das UI nicht kaputt machen.
