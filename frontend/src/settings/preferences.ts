// Preference options and local defaults for themes, fonts, and language.
// Also maps selected preferences into CSS variables.
import type { CSSProperties } from "react";
import type {
  AnimationIntensity,
  AppFont,
  BuiltInAppFont,
  BuiltInTextFont,
  CaretAnimationStyle,
  CaretMovementAnimation,
  CompletionAnimationStyle,
  CustomFont,
  ErrorFeedbackAnimation,
  KeyboardAnimationStyle,
  OnScreenKeyboardLayout,
  RestartKey,
  TextFont,
  TypingFeedbackAnimation,
  TypingLanguage
} from "../games/typing/types";
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

export const APP_FONT_OPTIONS: Array<SelectOption<BuiltInAppFont>> = [
  { value: "system-sans", label: "Standard Sans" },
  { value: "libre-baskerville", label: "Libre Baskerville" },
  { value: "smooch-sans", label: "Smooch Sans" },
  { value: "manrope", label: "Manrope" },
  { value: "nunito-sans", label: "Nunito Sans" }
];

export const TEXT_FONT_OPTIONS: Array<SelectOption<BuiltInTextFont>> = [
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
const DEFAULT_ANIMATION_INTENSITY: AnimationIntensity = "balanced";
const DEFAULT_CARET_ANIMATION: CaretAnimationStyle = "blink";
const DEFAULT_CARET_MOVEMENT_ANIMATION: CaretMovementAnimation = "slide";
const DEFAULT_TYPING_FEEDBACK_ANIMATION: TypingFeedbackAnimation = "lift";
const DEFAULT_ERROR_FEEDBACK_ANIMATION: ErrorFeedbackAnimation = "shake";
const DEFAULT_KEYBOARD_ANIMATION: KeyboardAnimationStyle = "press";
const DEFAULT_COMPLETION_ANIMATION: CompletionAnimationStyle = "confetti";

const FONT_STACKS: Record<BuiltInAppFont | BuiltInTextFont, string> = {
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

export function isAnimationIntensity(value: string | null | undefined): value is AnimationIntensity {
  return value === "off" || value === "calm" || value === "balanced" || value === "expressive";
}

export function getStoredAnimationIntensity(): AnimationIntensity {
  if (typeof window === "undefined") return DEFAULT_ANIMATION_INTENSITY;
  const storedValue = window.localStorage.getItem("rawtype-animation-intensity");
  return isAnimationIntensity(storedValue) ? storedValue : DEFAULT_ANIMATION_INTENSITY;
}

export function isCaretAnimationStyle(value: string | null | undefined): value is CaretAnimationStyle {
  return value === "steady" || value === "blink" || value === "glow" || value === "block" || value === "underline";
}

export function getStoredCaretAnimationStyle(): CaretAnimationStyle {
  if (typeof window === "undefined") return DEFAULT_CARET_ANIMATION;
  const storedValue = window.localStorage.getItem("rawtype-caret-animation");
  return isCaretAnimationStyle(storedValue) ? storedValue : DEFAULT_CARET_ANIMATION;
}

export function isCaretMovementAnimation(value: string | null | undefined): value is CaretMovementAnimation {
  return value === "instant" || value === "slide";
}

export function getStoredCaretMovementAnimation(): CaretMovementAnimation {
  if (typeof window === "undefined") return DEFAULT_CARET_MOVEMENT_ANIMATION;
  const storedValue = window.localStorage.getItem("rawtype-caret-movement-animation");
  return isCaretMovementAnimation(storedValue) ? storedValue : DEFAULT_CARET_MOVEMENT_ANIMATION;
}

export function isTypingFeedbackAnimation(value: string | null | undefined): value is TypingFeedbackAnimation {
  return value === "none" || value === "lift" || value === "pop" || value === "wave" || value === "ink";
}

export function getStoredTypingFeedbackAnimation(): TypingFeedbackAnimation {
  if (typeof window === "undefined") return DEFAULT_TYPING_FEEDBACK_ANIMATION;
  const storedValue = window.localStorage.getItem("rawtype-typing-feedback-animation");
  return isTypingFeedbackAnimation(storedValue) ? storedValue : DEFAULT_TYPING_FEEDBACK_ANIMATION;
}

export function isErrorFeedbackAnimation(value: string | null | undefined): value is ErrorFeedbackAnimation {
  return value === "none" || value === "shake" || value === "flash" || value === "snap" || value === "glitch";
}

export function getStoredErrorFeedbackAnimation(): ErrorFeedbackAnimation {
  if (typeof window === "undefined") return DEFAULT_ERROR_FEEDBACK_ANIMATION;
  const storedValue = window.localStorage.getItem("rawtype-error-feedback-animation");
  return isErrorFeedbackAnimation(storedValue) ? storedValue : DEFAULT_ERROR_FEEDBACK_ANIMATION;
}

export function isKeyboardAnimationStyle(value: string | null | undefined): value is KeyboardAnimationStyle {
  return value === "none" || value === "press" || value === "glow" || value === "ripple" || value === "tilt";
}

export function getStoredKeyboardAnimationStyle(): KeyboardAnimationStyle {
  if (typeof window === "undefined") return DEFAULT_KEYBOARD_ANIMATION;
  const storedValue = window.localStorage.getItem("rawtype-keyboard-animation");
  return isKeyboardAnimationStyle(storedValue) ? storedValue : DEFAULT_KEYBOARD_ANIMATION;
}

export function isCompletionAnimationStyle(value: string | null | undefined): value is CompletionAnimationStyle {
  return value === "none" || value === "pulse" || value === "confetti" || value === "sparkles" || value === "ribbons";
}

export function getStoredCompletionAnimationStyle(): CompletionAnimationStyle {
  if (typeof window === "undefined") return DEFAULT_COMPLETION_ANIMATION;
  const storedValue = window.localStorage.getItem("rawtype-completion-animation");
  return isCompletionAnimationStyle(storedValue) ? storedValue : DEFAULT_COMPLETION_ANIMATION;
}

export function isTypingLanguage(value: string | null | undefined): value is TypingLanguage {
  return value ? SUPPORTED_TYPING_LANGUAGES.includes(value as TypingLanguage) : false;
}

export function isCustomFontId(value: string | null | undefined): value is `custom:${string}` {
  return typeof value === "string" && /^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isBuiltInAppFont(value: string | null | undefined): value is BuiltInAppFont {
  return (
    value === "system-sans" ||
    value === "libre-baskerville" ||
    value === "smooch-sans" ||
    value === "manrope" ||
    value === "nunito-sans"
  );
}

export function isAppFont(value: string | null | undefined): value is AppFont {
  return isBuiltInAppFont(value) || isCustomFontId(value);
}

export function isBuiltInTextFont(value: string | null | undefined): value is BuiltInTextFont {
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

export function isTextFont(value: string | null | undefined): value is TextFont {
  return isBuiltInTextFont(value) || isCustomFontId(value);
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

export function getStoredGameLanguage(): TypingLanguage {
  if (typeof window === "undefined") return "en";
  const storedGameLanguage = window.localStorage.getItem("rawtype-game-language");
  return isTypingLanguage(storedGameLanguage) ? storedGameLanguage : getStoredLanguage();
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

function quoteFontFamily(familyName: string): string {
  return `"${familyName.replace(/["\\]/g, "\\$&")}"`;
}

function getFontStack(font: AppFont | TextFont, customFonts: CustomFont[], fallback: string): string {
  if (isCustomFontId(font)) {
    const customFont = customFonts.find((option) => option.selection === font);
    return customFont ? `${quoteFontFamily(customFont.familyName)}, ${fallback}` : fallback;
  }

  return FONT_STACKS[font];
}

export function getFontVariables(appFont: AppFont, textFont: TextFont, customFonts: CustomFont[] = []): CSSProperties {
  return {
    "--app-font": getFontStack(appFont, customFonts, FONT_STACKS["system-sans"]),
    "--typing-font": getFontStack(textFont, customFonts, FONT_STACKS["system-mono"]),
    "--brand-font": FONT_STACKS.sekuya
  } as CSSProperties;
}

export function getAnimationVariables(intensity: AnimationIntensity): CSSProperties {
  const variables: Record<AnimationIntensity, CSSProperties> = {
    off: {
      "--motion-fast": "1ms",
      "--motion-medium": "1ms",
      "--motion-slow": "1ms",
      "--motion-distance": "0px",
      "--motion-distance-negative": "0px",
      "--motion-distance-soft": "0px",
      "--motion-distance-soft-negative": "0px",
      "--motion-scale": "1"
    } as CSSProperties,
    calm: {
      "--motion-fast": "110ms",
      "--motion-medium": "190ms",
      "--motion-slow": "520ms",
      "--motion-distance": "2px",
      "--motion-distance-negative": "-2px",
      "--motion-distance-soft": "1px",
      "--motion-distance-soft-negative": "-1px",
      "--motion-scale": "1.015"
    } as CSSProperties,
    balanced: {
      "--motion-fast": "130ms",
      "--motion-medium": "240ms",
      "--motion-slow": "680ms",
      "--motion-distance": "4px",
      "--motion-distance-negative": "-4px",
      "--motion-distance-soft": "2px",
      "--motion-distance-soft-negative": "-2px",
      "--motion-scale": "1.035"
    } as CSSProperties,
    expressive: {
      "--motion-fast": "150ms",
      "--motion-medium": "310ms",
      "--motion-slow": "860ms",
      "--motion-distance": "7px",
      "--motion-distance-negative": "-7px",
      "--motion-distance-soft": "3px",
      "--motion-distance-soft-negative": "-3px",
      "--motion-scale": "1.07"
    } as CSSProperties
  };

  return variables[intensity];
}
