// Username-based auth helpers built on top of Supabase email login.
// Translates display usernames into the backing account identifier.
import type { TypingLanguage } from "../games/typing/types";
import { getUsernameValidationMessageText } from "../i18n/messages";

const RAWTYPE_AUTH_DOMAIN = "rawtype.local";

const reservedUsernames = new Set([
  "admin",
  "api",
  "auth",
  "guest",
  "login",
  "logout",
  "me",
  "profile",
  "rawtype",
  "root",
  "settings",
  "stats",
  "support",
  "system",
  "user",
  "username"
]);

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  const normalized = normalizeUsername(username);
  return /^[a-z0-9_]{3,20}$/.test(normalized) && !reservedUsernames.has(normalized);
}

export function getUsernameValidationMessage(username: string, language: TypingLanguage = "en"): string {
  const normalized = normalizeUsername(username);

  if (normalized.length < 3) {
    return getUsernameValidationMessageText(language, "tooShort");
  }
  if (normalized.length > 20) {
    return getUsernameValidationMessageText(language, "tooLong");
  }
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return getUsernameValidationMessageText(language, "invalidChars");
  }
  if (reservedUsernames.has(normalized)) {
    return getUsernameValidationMessageText(language, "reserved");
  }

  return "";
}

export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${RAWTYPE_AUTH_DOMAIN}`;
}
