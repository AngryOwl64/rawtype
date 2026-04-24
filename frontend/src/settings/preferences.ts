// Preference options and local defaults for themes, fonts, and language.
// Also maps selected preferences into CSS variables.
import type { CSSProperties } from "react";
import type { AppFont, OnScreenKeyboardLayout, RestartKey, TextFont, TypingLanguage } from "../games/typing/types";
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

export const APP_FONT_OPTIONS: Array<SelectOption<AppFont>> = [
  { value: "system-sans", label: "Standard Sans" },
  { value: "libre-baskerville", label: "Libre Baskerville" },
  { value: "smooch-sans", label: "Smooch Sans" },
  { value: "manrope", label: "Manrope" },
  { value: "nunito-sans", label: "Nunito Sans" }
];

export const TEXT_FONT_OPTIONS: Array<SelectOption<TextFont>> = [
  { value: "system-mono", label: "System Mono" },
  { value: "system-sans", label: "Standard Sans" },
  { value: "serif", label: "Classic Serif" },
  { value: "libre-baskerville", label: "Libre Baskerville" },
  { value: "smooch-sans", label: "Smooch Sans" },
  { value: "manrope", label: "Manrope" },
  { value: "nunito-sans", label: "Nunito Sans" },
  { value: "sekuya", label: "Sekuya" }
];

const DEFAULT_ON_SCREEN_KEYBOARD_LAYOUT: OnScreenKeyboardLayout = "us-qwerty";
const DEFAULT_RESTART_KEY: RestartKey = "Enter";

const FONT_STACKS: Record<AppFont | TextFont, string> = {
  "system-sans": '"Segoe UI", "Aptos", "Trebuchet MS", sans-serif',
  "system-mono": 'Consolas, Menlo, Monaco, "Segoe UI Mono", monospace',
  serif: 'Georgia, "Times New Roman", serif',
  "libre-baskerville": '"Libre Baskerville", Georgia, serif',
  "smooch-sans": '"Smooch Sans", "Trebuchet MS", sans-serif',
  manrope: 'Manrope, "Segoe UI", sans-serif',
  "nunito-sans": '"Nunito Sans", "Segoe UI", sans-serif',
  sekuya: '"Sekuya", system-ui'
};

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

export function isRestartKey(value: string | null | undefined): value is RestartKey {
  return value === "Enter" || value === "Escape";
}

export function getStoredRestartKey(): RestartKey {
  if (typeof window === "undefined") return DEFAULT_RESTART_KEY;
  const storedRestartKey = window.localStorage.getItem("rawtype-restart-key");
  return isRestartKey(storedRestartKey) ? storedRestartKey : DEFAULT_RESTART_KEY;
}

export function isTypingLanguage(value: string | null | undefined): value is TypingLanguage {
  return value ? SUPPORTED_TYPING_LANGUAGES.includes(value as TypingLanguage) : false;
}

export function isAppFont(value: string | null | undefined): value is AppFont {
  return (
    value === "system-sans" ||
    value === "libre-baskerville" ||
    value === "smooch-sans" ||
    value === "manrope" ||
    value === "nunito-sans"
  );
}

export function isTextFont(value: string | null | undefined): value is TextFont {
  return (
    value === "system-mono" ||
    value === "system-sans" ||
    value === "serif" ||
    value === "libre-baskerville" ||
    value === "smooch-sans" ||
    value === "manrope" ||
    value === "nunito-sans" ||
    value === "sekuya"
  );
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

export function getStoredAppFont(): AppFont {
  if (typeof window === "undefined") return "system-sans";
  const storedAppFont = window.localStorage.getItem("rawtype-app-font");
  return isAppFont(storedAppFont) ? storedAppFont : "system-sans";
}

export function getStoredTextFont(): TextFont {
  if (typeof window === "undefined") return "system-mono";
  const storedTextFont = window.localStorage.getItem("rawtype-text-font");

  if (isTextFont(storedTextFont)) {
    return storedTextFont;
  }

  const legacyFont = window.localStorage.getItem("rawtype-font");
  if (legacyFont === "sans") return "system-sans";
  if (legacyFont === "serif") return "serif";
  if (legacyFont === "system-mono") return "system-mono";

  return "system-mono";
}

export function getLanguageLabel(language: TypingLanguage): string {
  return getLanguageLabelFromMessages(language);
}

export function getThemeVariables(theme: ThemeMode): CSSProperties {
  return getThemeCssVariables(theme);
}

export function getFontVariables(appFont: AppFont, textFont: TextFont): CSSProperties {
  return {
    "--app-font": FONT_STACKS[appFont],
    "--typing-font": FONT_STACKS[textFont],
    "--brand-font": FONT_STACKS.sekuya
  } as CSSProperties;
}
