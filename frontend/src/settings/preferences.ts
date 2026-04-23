// Preference options and local defaults for themes, fonts, and language.
// Also maps selected preferences into CSS variables.
import type { CSSProperties } from "react";
import type { OnScreenKeyboardLayout, TypingFont, TypingLanguage } from "../games/typing/types";
import { getPathTypingLanguage, SUPPORTED_TYPING_LANGUAGES } from "../i18n/language";
import { getLanguageLabelFromMessages, getLanguageOptionsFromMessages } from "../i18n/messages";
import {
  DEFAULT_THEME_ID,
  getThemeVariables as getThemeCssVariables,
  type ThemeId,
  resolveThemeId
} from "../themes/registry";

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

const DEFAULT_ON_SCREEN_KEYBOARD_LAYOUT: OnScreenKeyboardLayout = "us-qwerty";

export function isOnScreenKeyboardLayout(value: string | null | undefined): value is OnScreenKeyboardLayout {
  return (
    value === "us-qwerty" ||
    value === "uk-qwerty" ||
    value === "de-qwertz" ||
    value === "fr-azerty" ||
    value === "es-qwerty"
  );
}

export function getStoredOnScreenKeyboardLayout(): OnScreenKeyboardLayout {
  if (typeof window === "undefined") return DEFAULT_ON_SCREEN_KEYBOARD_LAYOUT;
  const storedLayout = window.localStorage.getItem("rawtype-onscreen-keyboard-layout");
  return isOnScreenKeyboardLayout(storedLayout) ? storedLayout : DEFAULT_ON_SCREEN_KEYBOARD_LAYOUT;
}

export function isTypingLanguage(value: string | null | undefined): value is TypingLanguage {
  return value ? SUPPORTED_TYPING_LANGUAGES.includes(value as TypingLanguage) : false;
}

export function isTypingFont(value: string | null | undefined): value is TypingFont {
  return value === "system-mono" || value === "sans" || value === "serif";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  const storedTheme = window.localStorage.getItem("rawtype-theme");
  return resolveThemeId(storedTheme);
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
  return getThemeCssVariables(theme);
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
