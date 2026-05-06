// Local-only settings for the custom typing mode.
// Kept separate from account defaults so custom controls do not duplicate global options.
import type {
  CustomCasingMode,
  CustomLetterFocus,
  CustomNumberMode,
  CustomPunctuationMode,
  CustomRepeatMode,
  CustomRhythmMode,
  CustomSymbolMode,
  CustomTypingSettings
} from "./types";

const STORAGE_KEY = "rawtype-custom-typing-settings";
const PINNED_WORD_LIMIT = 18;

export const DEFAULT_CUSTOM_TYPING_SETTINGS: CustomTypingSettings = {
  casing: "natural",
  punctuation: "light",
  numbers: "light",
  symbols: "none",
  repeats: "light",
  letterFocus: "balanced",
  rhythm: "bursts",
  pinnedWords: ""
};

function isCustomCasingMode(value: unknown): value is CustomCasingMode {
  return value === "natural" || value === "lowercase" || value === "uppercase" || value === "title";
}

function isCustomPunctuationMode(value: unknown): value is CustomPunctuationMode {
  return value === "none" || value === "light" || value === "dense";
}

function isCustomNumberMode(value: unknown): value is CustomNumberMode {
  return value === "none" || value === "light" || value === "dense";
}

function isCustomSymbolMode(value: unknown): value is CustomSymbolMode {
  return value === "none" || value === "light" || value === "dense";
}

function isCustomRepeatMode(value: unknown): value is CustomRepeatMode {
  return value === "none" || value === "light" || value === "dense";
}

function isCustomLetterFocus(value: unknown): value is CustomLetterFocus {
  return value === "balanced" || value === "home-row" || value === "top-row" || value === "left-hand" || value === "right-hand";
}

function isCustomRhythmMode(value: unknown): value is CustomRhythmMode {
  return value === "steady" || value === "bursts" || value === "staggered";
}

export function normalizePinnedWordsInput(value: string): string {
  return value
    .split(/[\s,;]+/u)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, PINNED_WORD_LIMIT)
    .join(", ");
}

export function normalizeCustomTypingSettings(raw: unknown): CustomTypingSettings {
  const value = raw && typeof raw === "object" ? raw as Partial<Record<keyof CustomTypingSettings, unknown>> : {};

  return {
    casing: isCustomCasingMode(value.casing) ? value.casing : DEFAULT_CUSTOM_TYPING_SETTINGS.casing,
    punctuation: isCustomPunctuationMode(value.punctuation)
      ? value.punctuation
      : DEFAULT_CUSTOM_TYPING_SETTINGS.punctuation,
    numbers: isCustomNumberMode(value.numbers) ? value.numbers : DEFAULT_CUSTOM_TYPING_SETTINGS.numbers,
    symbols: isCustomSymbolMode(value.symbols) ? value.symbols : DEFAULT_CUSTOM_TYPING_SETTINGS.symbols,
    repeats: isCustomRepeatMode(value.repeats) ? value.repeats : DEFAULT_CUSTOM_TYPING_SETTINGS.repeats,
    letterFocus: isCustomLetterFocus(value.letterFocus)
      ? value.letterFocus
      : DEFAULT_CUSTOM_TYPING_SETTINGS.letterFocus,
    rhythm: isCustomRhythmMode(value.rhythm) ? value.rhythm : DEFAULT_CUSTOM_TYPING_SETTINGS.rhythm,
    pinnedWords:
      typeof value.pinnedWords === "string"
        ? normalizePinnedWordsInput(value.pinnedWords)
        : DEFAULT_CUSTOM_TYPING_SETTINGS.pinnedWords
  };
}

export function getStoredCustomTypingSettings(): CustomTypingSettings {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_TYPING_SETTINGS;

  try {
    return normalizeCustomTypingSettings(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return DEFAULT_CUSTOM_TYPING_SETTINGS;
  }
}

export function setStoredCustomTypingSettings(settings: CustomTypingSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCustomTypingSettings(settings)));
}
