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

export function getUsernameValidationMessage(username: string): string {
  const normalized = normalizeUsername(username);

  if (normalized.length < 3) return "Username must be at least 3 characters.";
  if (normalized.length > 20) return "Username must be 20 characters or less.";
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return "Use only letters, numbers, and underscores.";
  }
  if (reservedUsernames.has(normalized)) return "This username is reserved.";

  return "";
}

export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${RAWTYPE_AUTH_DOMAIN}`;
}
