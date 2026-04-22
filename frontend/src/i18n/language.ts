// Language helpers for supported typing languages and browser locale use.
// Keeps language fallback rules consistent across the app.
import type { TypingLanguage } from "../games/typing/types";

export const SUPPORTED_TYPING_LANGUAGES: TypingLanguage[] = ["en", "de"];

export function resolveTypingLanguage(language: string | null | undefined): TypingLanguage {
  if (language && SUPPORTED_TYPING_LANGUAGES.includes(language as TypingLanguage)) {
    return language as TypingLanguage;
  }
  return "en";
}

export function getLocaleForLanguage(language: string | null | undefined): string {
  return resolveTypingLanguage(language) === "de" ? "de-DE" : "en-US";
}

export function getPathTypingLanguage(): TypingLanguage | null {
  if (typeof window === "undefined") return null;
  const firstPathSegment = window.location.pathname.split("/").filter(Boolean)[0];
  return SUPPORTED_TYPING_LANGUAGES.includes(firstPathSegment as TypingLanguage)
    ? (firstPathSegment as TypingLanguage)
    : null;
}

export function getStoredUiLanguage(): TypingLanguage {
  if (typeof window === "undefined") return "en";
  const pathLanguage = getPathTypingLanguage();
  if (pathLanguage) return pathLanguage;
  const value = window.localStorage.getItem("rawtype-language");
  return resolveTypingLanguage(value);
}
