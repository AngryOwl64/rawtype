const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function getStoredBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const storedValue = window.localStorage.getItem(key);
  if (storedValue === null) return defaultValue;
  return storedValue === "true";
}

export function getStoredHexColor(key: string, defaultValue: string): string {
  if (typeof window === "undefined") return defaultValue;
  const storedValue = window.localStorage.getItem(key);
  return storedValue && HEX_COLOR_PATTERN.test(storedValue) ? storedValue : defaultValue;
}

export function setStoredValue(key: string, value: string | number | boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}
