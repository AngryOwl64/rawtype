// Preference options and local defaults for themes, fonts, and language.
// Also maps selected preferences into CSS variables.
import type { CSSProperties } from "react";
import type { TypingFont, TypingLanguage } from "../games/typing/types";
import { getPathTypingLanguage, SUPPORTED_TYPING_LANGUAGES } from "../i18n/language";
import { getLanguageLabelFromMessages, getLanguageOptionsFromMessages } from "../i18n/messages";
import type { ThemeId } from "../themes/types";

export type ThemeMode = ThemeId;

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export const LANGUAGE_OPTIONS: Array<SelectOption<TypingLanguage>> = getLanguageOptionsFromMessages();

export const FONT_OPTIONS: Array<SelectOption<TypingFont>> = [
  { value: "system-mono", label: "System mono" },
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" }
];

export function isTypingLanguage(value: string | null | undefined): value is TypingLanguage {
  return value ? SUPPORTED_TYPING_LANGUAGES.includes(value as TypingLanguage) : false;
}

export function isTypingFont(value: string | null | undefined): value is TypingFont {
  return value === "system-mono" || value === "sans" || value === "serif";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "pergament";
  const storedTheme = window.localStorage.getItem("rawtype-theme");

  if (storedTheme === "monokai" || storedTheme === "obsidian" || storedTheme === "dark") return "monokai";
  if (storedTheme === "pergament" || storedTheme === "light") return "pergament";
  return "pergament";
}

export function getStoredLanguage(): TypingLanguage {
  if (typeof window === "undefined") return "en";
  const pathLanguage = getPathTypingLanguage();
  if (pathLanguage) return pathLanguage;
  const storedLanguage = window.localStorage.getItem("rawtype-language");
  return isTypingLanguage(storedLanguage) ? storedLanguage : "en";
}

export function getStoredFont(): TypingFont {
  if (typeof window === "undefined") return "system-mono";
  const storedFont = window.localStorage.getItem("rawtype-font");
  return isTypingFont(storedFont) ? storedFont : "system-mono";
}

export function getLanguageLabel(language: TypingLanguage): string {
  return getLanguageLabelFromMessages(language);
}

export function getThemeVariables(theme: ThemeMode): CSSProperties {
  const isMonokai = theme === "monokai";

  return {
    "--page-bg": isMonokai ? "#272822" : "#ece8df",
    "--header-bg": isMonokai ? "rgba(39, 40, 34, 0.96)" : "rgba(244, 239, 229, 0.94)",
    "--text": isMonokai ? "#f8f8f2" : "#232a33",
    "--muted": isMonokai ? "#a8a8a3" : "#5e6670",
    "--muted-strong": isMonokai ? "#f8f8f2" : "#38414d",
    "--surface": isMonokai ? "#313327" : "#f7f4ee",
    "--surface-soft": isMonokai ? "#3e3d32" : "#f1ece4",
    "--input-bg": isMonokai ? "#3b3a32" : "#fdfaf3",
    "--input-muted": isMonokai ? "#46463b" : "#ece6dc",
    "--border": isMonokai ? "#4c4b42" : "#c4c0b7",
    "--border-soft": isMonokai ? "#3f3e35" : "#d7d2c8",
    "--border-strong": isMonokai ? "#59574d" : "#a8b0b8",
    "--primary": isMonokai ? "#66d9ef" : "#2f3742",
    "--primary-text": isMonokai ? "#272822" : "#f8fafc",
    "--success": isMonokai ? "#a6e22e" : "#2f7a3f",
    "--danger": isMonokai ? "#f92672" : "#a03a46",
    "--danger-bg": isMonokai ? "#3a2030" : "#f8e8ea",
    "--danger-border": isMonokai ? "#6b3853" : "#d8b2b8"
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
