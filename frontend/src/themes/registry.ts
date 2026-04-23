// Built-in theme registry and lookup helpers for RawType.
// Keeps all built-in theme data in one source of truth.
import type { CSSProperties } from "react";
import type { TypingLanguage } from "../games/typing/types";
import type { ThemeToken } from "./types";

type ThemeColors = Readonly<Record<ThemeToken, string>>;

type ThemeDefinition = {
  id: string;
  name: string;
  description: string;
  localizedDescription?: Partial<Record<TypingLanguage, string>>;
  aliases?: ReadonlyArray<string>;
  colors: ThemeColors;
};

type ThemeDefinitionShape = typeof THEME_DEFINITIONS[number];
export type ThemeId = ThemeDefinitionShape["id"];

export type BuiltInTheme = {
  id: ThemeId;
  name: string;
  description: string;
  swatches: {
    page: string;
    surface: string;
    text: string;
    accent: string;
  };
};

const THEME_DEFINITIONS = [
  {
    id: "pergament",
    name: "Pergament",
    description: "Warm, paper-like light theme.",
    localizedDescription: {
      de: "Warmes, papierartiges helles Theme."
    },
    aliases: ["light"],
    colors: {
      "--page-bg": "#ece8df",
      "--header-bg": "rgba(244, 239, 229, 0.94)",
      "--text": "#232a33",
      "--muted": "#5e6670",
      "--muted-strong": "#38414d",
      "--surface": "#f7f4ee",
      "--surface-soft": "#f1ece4",
      "--input-bg": "#fdfaf3",
      "--input-muted": "#ece6dc",
      "--border": "#c4c0b7",
      "--border-soft": "#d7d2c8",
      "--border-strong": "#a8b0b8",
      "--primary": "#2f3742",
      "--primary-text": "#f8fafc",
      "--success": "#2f7a3f",
      "--danger": "#a03a46",
      "--danger-bg": "#f8e8ea",
      "--danger-border": "#d8b2b8"
    }
  },
  {
    id: "monokai",
    name: "Monokai",
    description: "High-contrast dark theme.",
    localizedDescription: {
      de: "Kontrastreiches dunkles Theme."
    },
    aliases: ["dark", "obsidian"],
    colors: {
      "--page-bg": "#272822",
      "--header-bg": "rgba(39, 40, 34, 0.96)",
      "--text": "#f8f8f2",
      "--muted": "#a8a8a3",
      "--muted-strong": "#f8f8f2",
      "--surface": "#313327",
      "--surface-soft": "#3e3d32",
      "--input-bg": "#3b3a32",
      "--input-muted": "#46463b",
      "--border": "#4c4b42",
      "--border-soft": "#3f3e35",
      "--border-strong": "#59574d",
      "--primary": "#66d9ef",
      "--primary-text": "#272822",
      "--success": "#a6e22e",
      "--danger": "#f92672",
      "--danger-bg": "#3a2030",
      "--danger-border": "#6b3853"
    }
  }
] as const satisfies ReadonlyArray<ThemeDefinition>;

export const DEFAULT_THEME_ID: ThemeId = "pergament";

class ThemeCatalog {
  private readonly defaultThemeId: ThemeId;
  private readonly themesById: ReadonlyMap<ThemeId, ThemeDefinitionShape>;
  private readonly themeIds: ReadonlySet<string>;
  private readonly aliasToThemeId: ReadonlyMap<string, ThemeId>;
  readonly builtInThemes: ReadonlyArray<BuiltInTheme>;

  constructor(themes: ReadonlyArray<ThemeDefinitionShape>, defaultThemeId: ThemeId) {
    this.defaultThemeId = defaultThemeId;
    this.themesById = new Map(themes.map((theme) => [theme.id, theme]));
    this.themeIds = new Set(themes.map((theme) => theme.id));

    const aliasEntries: Array<[string, ThemeId]> = [];
    for (const theme of themes) {
      aliasEntries.push([theme.id, theme.id]);
      for (const alias of theme.aliases ?? []) {
        aliasEntries.push([alias, theme.id]);
      }
    }
    this.aliasToThemeId = new Map(aliasEntries);

    this.builtInThemes = themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      swatches: {
        page: theme.colors["--page-bg"],
        surface: theme.colors["--surface"],
        text: theme.colors["--text"],
        accent: theme.colors["--primary"]
      }
    }));
  }

  isThemeId(value: string | null | undefined): value is ThemeId {
    return typeof value === "string" && this.themeIds.has(value);
  }

  resolveThemeId(value: string | null | undefined): ThemeId {
    if (!value) return this.defaultThemeId;
    return this.aliasToThemeId.get(value) ?? this.defaultThemeId;
  }

  getThemeName(themeId: ThemeId): string {
    return this.getTheme(themeId).name;
  }

  getThemeDescription(themeId: ThemeId, language: TypingLanguage): string {
    const theme = this.getTheme(themeId);
    if (language === "en") {
      return theme.description;
    }
    return theme.localizedDescription?.[language] ?? theme.description;
  }

  getThemeVariables(themeId: ThemeId): CSSProperties {
    return { ...this.getTheme(themeId).colors } as CSSProperties;
  }

  private getTheme(themeId: ThemeId): ThemeDefinitionShape {
    return this.themesById.get(themeId) ?? this.themesById.get(this.defaultThemeId)!;
  }
}

const catalog = new ThemeCatalog(THEME_DEFINITIONS, DEFAULT_THEME_ID);

export const BUILT_IN_THEMES: ReadonlyArray<BuiltInTheme> = catalog.builtInThemes;

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return catalog.isThemeId(value);
}

export function resolveThemeId(value: string | null | undefined): ThemeId {
  return catalog.resolveThemeId(value);
}

export function getThemeVariables(themeId: ThemeId): CSSProperties {
  return catalog.getThemeVariables(themeId);
}

export function getBuiltInThemeName(themeId: ThemeId): string {
  return catalog.getThemeName(themeId);
}

export function getBuiltInThemeDescription(themeId: ThemeId, language: TypingLanguage): string {
  return catalog.getThemeDescription(themeId, language);
}
