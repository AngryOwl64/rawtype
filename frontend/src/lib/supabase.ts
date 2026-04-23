// Supabase client setup shared by auth, stats, and typing services.
// Reads browser-safe configuration from Vite environment variables.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const AUTH_SESSION_REMEMBER_KEY = "rawtype.auth.remember_session";
const DEFAULT_REMEMBER_SESSION = true;
const memoryStorage = new Map<string, string>();

type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const fallbackStorage: StorageAdapter = {
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, value) => {
    memoryStorage.set(key, value);
  },
  removeItem: (key) => {
    memoryStorage.delete(key);
  }
};

function readStorageSafe(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageSafe(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage write failures and keep auth flow functional.
  }
}

function removeStorageSafe(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage remove failures.
  }
}

function getLocalStorageAdapter(): StorageAdapter | null {
  if (typeof window === "undefined") return null;

  try {
    const storage = window.localStorage;
    const testKey = "__rawtype_local_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return {
      getItem: (key) => readStorageSafe(storage, key),
      setItem: (key, value) => writeStorageSafe(storage, key, value),
      removeItem: (key) => removeStorageSafe(storage, key)
    };
  } catch {
    return null;
  }
}

function getSessionStorageAdapter(): StorageAdapter | null {
  if (typeof window === "undefined") return null;

  try {
    const storage = window.sessionStorage;
    const testKey = "__rawtype_session_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return {
      getItem: (key) => readStorageSafe(storage, key),
      setItem: (key, value) => writeStorageSafe(storage, key, value),
      removeItem: (key) => removeStorageSafe(storage, key)
    };
  } catch {
    return null;
  }
}

function getDefaultAuthStorageKey(): string | null {
  if (!supabaseUrl) return null;

  try {
    const hostname = new URL(supabaseUrl).hostname;
    const projectRef = hostname.split(".")[0];
    return projectRef.length > 0 ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

const trackedAuthKeys = new Set<string>();
const defaultAuthStorageKey = getDefaultAuthStorageKey();
if (defaultAuthStorageKey) {
  trackedAuthKeys.add(defaultAuthStorageKey);
}

function resolveAuthStorages(rememberSession: boolean): {
  preferred: StorageAdapter;
  secondary: StorageAdapter | null;
} {
  const localStorageAdapter = getLocalStorageAdapter();
  const sessionStorageAdapter = getSessionStorageAdapter();

  if (rememberSession) {
    if (localStorageAdapter && sessionStorageAdapter) {
      return { preferred: localStorageAdapter, secondary: sessionStorageAdapter };
    }
    if (localStorageAdapter) return { preferred: localStorageAdapter, secondary: null };
    if (sessionStorageAdapter) return { preferred: sessionStorageAdapter, secondary: null };
    return { preferred: fallbackStorage, secondary: null };
  }

  if (sessionStorageAdapter && localStorageAdapter) {
    return { preferred: sessionStorageAdapter, secondary: localStorageAdapter };
  }
  if (sessionStorageAdapter) return { preferred: sessionStorageAdapter, secondary: null };
  if (localStorageAdapter) return { preferred: localStorageAdapter, secondary: null };
  return { preferred: fallbackStorage, secondary: null };
}

function migrateTrackedAuthKeys(rememberSession: boolean): void {
  const { preferred, secondary } = resolveAuthStorages(rememberSession);
  if (!secondary) return;

  for (const key of trackedAuthKeys) {
    const value = preferred.getItem(key) ?? secondary.getItem(key);
    if (value === null) continue;
    preferred.setItem(key, value);
    secondary.removeItem(key);
  }
}

export function getRememberSessionPreference(): boolean {
  const localStorageAdapter = getLocalStorageAdapter();
  if (!localStorageAdapter) return DEFAULT_REMEMBER_SESSION;

  const storedValue = localStorageAdapter.getItem(AUTH_SESSION_REMEMBER_KEY);
  if (storedValue === null) return DEFAULT_REMEMBER_SESSION;
  return storedValue === "true";
}

export function setRememberSessionPreference(rememberSession: boolean): void {
  const localStorageAdapter = getLocalStorageAdapter();
  localStorageAdapter?.setItem(AUTH_SESSION_REMEMBER_KEY, String(rememberSession));
  migrateTrackedAuthKeys(rememberSession);
}

const rememberSessionStorage: StorageAdapter = {
  getItem: (key) => {
    trackedAuthKeys.add(key);
    const { preferred, secondary } = resolveAuthStorages(getRememberSessionPreference());
    const preferredValue = preferred.getItem(key);
    if (preferredValue !== null) return preferredValue;
    if (!secondary) return null;

    const secondaryValue = secondary.getItem(key);
    if (secondaryValue !== null) {
      preferred.setItem(key, secondaryValue);
      secondary.removeItem(key);
    }
    return secondaryValue;
  },
  setItem: (key, value) => {
    trackedAuthKeys.add(key);
    const { preferred, secondary } = resolveAuthStorages(getRememberSessionPreference());
    preferred.setItem(key, value);
    secondary?.removeItem(key);
  },
  removeItem: (key) => {
    trackedAuthKeys.add(key);
    const localStorageAdapter = getLocalStorageAdapter();
    const sessionStorageAdapter = getSessionStorageAdapter();
    localStorageAdapter?.removeItem(key);
    sessionStorageAdapter?.removeItem(key);
    fallbackStorage.removeItem(key);
  }
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: rememberSessionStorage
      }
    })
  : null;
