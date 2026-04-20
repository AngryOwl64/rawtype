import type { CSSProperties } from "react";
import type { TypingFont, TypingLanguage } from "../games/typing/types";

export type ThemeMode = "light" | "dark";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export const LANGUAGE_OPTIONS: Array<SelectOption<TypingLanguage>> = [
  { value: "en", label: "English" },
  { value: "de", label: "German" }
];

export const FONT_OPTIONS: Array<SelectOption<TypingFont>> = [
  { value: "system-mono", label: "System mono" },
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" }
];

export function isTypingLanguage(value: string | null | undefined): value is TypingLanguage {
  return value === "en" || value === "de";
}

export function isTypingFont(value: string | null | undefined): value is TypingFont {
  return value === "system-mono" || value === "sans" || value === "serif";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem("rawtype-theme") === "dark" ? "dark" : "light";
}

export function getStoredLanguage(): TypingLanguage {
  if (typeof window === "undefined") return "en";
  const storedLanguage = window.localStorage.getItem("rawtype-language");
  return isTypingLanguage(storedLanguage) ? storedLanguage : "en";
}

export function getStoredFont(): TypingFont {
  if (typeof window === "undefined") return "system-mono";
  const storedFont = window.localStorage.getItem("rawtype-font");
  return isTypingFont(storedFont) ? storedFont : "system-mono";
}

export function getLanguageLabel(language: TypingLanguage): string {
  return LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? "English";
}

export function getThemeVariables(theme: ThemeMode): CSSProperties {
  const dark = theme === "dark";

  return {
    "--page-bg": dark ? "#272822" : "#ece8df",
    "--header-bg": dark ? "rgba(39, 40, 34, 0.96)" : "rgba(244, 239, 229, 0.94)",
    "--text": dark ? "#f8f8f2" : "#232a33",
    "--muted": dark ? "#a8a8a3" : "#5e6670",
    "--muted-strong": dark ? "#f8f8f2" : "#38414d",
    "--surface": dark ? "#313327" : "#f7f4ee",
    "--surface-soft": dark ? "#3e3d32" : "#f1ece4",
    "--input-bg": dark ? "#3b3a32" : "#fdfaf3",
    "--input-muted": dark ? "#46463b" : "#ece6dc",
    "--border": dark ? "#4c4b42" : "#c4c0b7",
    "--border-soft": dark ? "#3f3e35" : "#d7d2c8",
    "--border-strong": dark ? "#59574d" : "#a8b0b8",
    "--primary": dark ? "#66d9ef" : "#2f3742",
    "--primary-text": dark ? "#272822" : "#f8fafc",
    "--success": dark ? "#a6e22e" : "#3b7b4f",
    "--danger": dark ? "#f92672" : "#8f4a54",
    "--danger-bg": dark ? "#3a2030" : "#f3e7e8",
    "--danger-border": dark ? "#6b3853" : "#d7c3c6"
  } as CSSProperties;
}

export function getFontVariables(font: TypingFont): CSSProperties {
  if (font === "sans") {
    return {
      "--app-font": "'Segoe UI', 'Aptos', 'Trebuchet MS', sans-serif",
      "--typing-font": "'Segoe UI', 'Aptos', 'Trebuchet MS', sans-serif"
    } as CSSProperties;
  }

  if (font === "serif") {
    return {
      "--app-font": "Georgia, 'Times New Roman', serif",
      "--typing-font": "Georgia, 'Times New Roman', serif"
    } as CSSProperties;
  }

  return {
    "--app-font": "'Segoe UI', 'Aptos', 'Trebuchet MS', sans-serif",
    "--typing-font": "Consolas, Menlo, Monaco, 'Segoe UI Mono', monospace"
  } as CSSProperties;
}
