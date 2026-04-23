// Provides Supabase auth state and profile settings to the app.
// Keeps account loading, refresh, and update logic in one place.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  setRememberSessionPreference,
  supabase
} from "../lib/supabase";
import { getStoredUiLanguage } from "../i18n/language";
import { translateAuthText } from "../i18n/messages";
import {
  getUsernameValidationMessage,
  isValidUsername,
  normalizeUsername
} from "./usernameAuth";
import {
  AuthContext,
  type AuthContextValue,
  type Profile,
  type ProfileUpdate,
  type UserSettings,
  type UserSettingsUpdate
} from "./authContext";

function getAuthErrorMessage(error: unknown): string {
  const language = getStoredUiLanguage();
  const t = (en: string) => translateAuthText(language, en);
  let rawMessage = "";

  if (error instanceof Error && error.message) {
    rawMessage = error.message;
  } else if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      rawMessage = message;
    }
  } else if (typeof error === "string") {
    rawMessage = error;
  }

  if (!rawMessage) {
    return t("Something went wrong. Please try again.");
  }

  const message = rawMessage.toLowerCase();

  if (message.includes("email rate limit")) {
    return t(
      "Signup is blocked by Supabase's email rate limit. Turn off email confirmation in Supabase Auth, then wait for the current rate limit to reset."
    );
  }

  if (message.includes("invalid login credentials")) {
    return t("Username or password is incorrect.");
  }

  return rawMessage;
}

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(translateAuthText(getStoredUiLanguage(), "Supabase is not configured."));
  }

  return supabase;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle();

  if (error) throw new Error(getAuthErrorMessage(error));
  return data;
}

async function fetchSettings(userId: string): Promise<UserSettings | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(getAuthErrorMessage(error));
  return data;
}

async function ensureUsernameAvailable(username: string): Promise<void> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("is_username_available", { value: username });

  if (error) throw new Error(getAuthErrorMessage(error));
  if (!data) throw new Error(translateAuthText(getStoredUiLanguage(), "This username is already taken."));
}

async function resolveLoginEmail(identifier: string): Promise<string> {
  const language = getStoredUiLanguage();
  const normalizedIdentifier = identifier.trim().toLowerCase();

  if (isValidEmail(normalizedIdentifier)) {
    return normalizedIdentifier;
  }

  if (normalizedIdentifier.includes("@")) {
    throw new Error(translateAuthText(language, "Please enter a valid username or email address."));
  }

  if (!isValidUsername(normalizedIdentifier)) {
    throw new Error(translateAuthText(language, "Please enter a valid username or email address."));
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("get_auth_email_for_username", {
    value: normalizeUsername(normalizedIdentifier)
  });

  if (error) throw new Error(getAuthErrorMessage(error));
  if (!data) throw new Error(translateAuthText(language, "Username or password is incorrect."));

  return normalizeEmail(data);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  const loadAccount = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);

    if (!nextUser) {
      setProfile(null);
      setSettings(null);
      return;
    }

    const [nextProfile, nextSettings] = await Promise.all([
      fetchProfile(nextUser.id),
      fetchSettings(nextUser.id)
    ]);

    setProfile(nextProfile);
    setSettings(nextSettings);
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!supabase) return;

    setError("");
    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      setError(getAuthErrorMessage(sessionError));
      return;
    }

    await loadAccount(data.session?.user ?? null);
  }, [loadAccount]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError(getAuthErrorMessage(sessionError));
        return loadAccount(data.session?.user ?? null);
      })
      .catch((authError: unknown) => {
        if (active) setError(getAuthErrorMessage(authError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAccount(session?.user ?? null).catch((authError: unknown) => {
        setError(getAuthErrorMessage(authError));
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAccount]);

  const signIn = useCallback(async (identifier: string, password: string, rememberSession = true) => {
    const language = getStoredUiLanguage();
    if (password.length === 0) {
      throw new Error(translateAuthText(language, "Password is required."));
    }

    const client = requireSupabaseClient();
    setRememberSessionPreference(rememberSession);
    const resolvedEmail = await resolveLoginEmail(identifier);
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: resolvedEmail,
      password
    });

    if (signInError) throw new Error(getAuthErrorMessage(signInError));
    await loadAccount(data.user);
  }, [loadAccount]);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const language = getStoredUiLanguage();
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      throw new Error(translateAuthText(language, "Please enter a valid email address."));
    }
    if (!isValidUsername(username)) {
      throw new Error(getUsernameValidationMessage(username, language));
    }
    if (password.length < 8) {
      throw new Error(translateAuthText(language, "Password must be at least 8 characters."));
    }

    const client = requireSupabaseClient();
    const normalizedUsername = normalizeUsername(username);

    await ensureUsernameAvailable(normalizedUsername);

    const { data, error: signUpError } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          username: normalizedUsername
        }
      }
    });

    if (signUpError) throw new Error(getAuthErrorMessage(signUpError));

    if (data.user) {
      await loadAccount(data.user);
    }
  }, [loadAccount]);

  const signOut = useCallback(async () => {
    const client = requireSupabaseClient();
    const { error: signOutError } = await client.auth.signOut();

    if (signOutError) throw new Error(getAuthErrorMessage(signOutError));
    await loadAccount(null);
  }, [loadAccount]);

  const updateUsername = useCallback(async (nextUsername: string, currentPassword: string) => {
    const language = getStoredUiLanguage();
    if (!user || !profile?.username) {
      throw new Error(translateAuthText(language, "Account profile is not loaded."));
    }

    const normalizedUsername = normalizeUsername(nextUsername);

    if (!isValidUsername(normalizedUsername)) {
      throw new Error(getUsernameValidationMessage(normalizedUsername, language));
    }
    if (currentPassword.length === 0) {
      throw new Error(translateAuthText(language, "Current password is required."));
    }
    if (normalizedUsername === normalizeUsername(profile.username)) {
      return;
    }

    await ensureUsernameAvailable(normalizedUsername);

    const currentAuthEmail = normalizeEmail(user.email ?? "");

    if (!isValidEmail(currentAuthEmail)) {
      throw new Error(translateAuthText(language, "Current account email is missing or invalid."));
    }

    const client = requireSupabaseClient();

    const { error: signInError } = await client.auth.signInWithPassword({
      email: currentAuthEmail,
      password: currentPassword
    });

    if (signInError) throw new Error(getAuthErrorMessage(signInError));

    const { error: authUpdateError } = await client.auth.updateUser({
      data: {
        username: normalizedUsername
      }
    });

    if (authUpdateError) throw new Error(getAuthErrorMessage(authUpdateError));

    const { data: nextProfile, error: profileError } = await client
      .from("profiles")
      .update({ username: normalizedUsername })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (profileError) throw new Error(getAuthErrorMessage(profileError));
    setProfile(nextProfile);

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw new Error(getAuthErrorMessage(userError));
    await loadAccount(userData.user ?? user);
  }, [loadAccount, profile, user]);

  const updatePassword = useCallback(async (currentPassword: string, nextPassword: string) => {
    const language = getStoredUiLanguage();
    if (!user) {
      throw new Error(translateAuthText(language, "Account user is not loaded."));
    }
    if (currentPassword.length === 0) {
      throw new Error(translateAuthText(language, "Current password is required."));
    }
    if (nextPassword.length < 8) {
      throw new Error(translateAuthText(language, "New password must be at least 8 characters."));
    }

    const currentAuthEmail = normalizeEmail(user.email ?? "");

    if (!isValidEmail(currentAuthEmail)) {
      throw new Error(translateAuthText(language, "Current account email is missing or invalid."));
    }

    const client = requireSupabaseClient();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: currentAuthEmail,
      password: currentPassword
    });

    if (signInError) throw new Error(getAuthErrorMessage(signInError));

    const { error: passwordError } = await client.auth.updateUser({
      password: nextPassword
    });

    if (passwordError) throw new Error(getAuthErrorMessage(passwordError));
  }, [user]);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!user) {
      return;
    }

    const client = requireSupabaseClient();
    const { data, error: profileError } = await client
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (profileError) throw new Error(getAuthErrorMessage(profileError));
    setProfile(data);
  }, [user]);

  const updateSettings = useCallback(async (updates: UserSettingsUpdate) => {
    if (!user) {
      return;
    }

    const client = requireSupabaseClient();
    const { data, error: settingsError } = await client
      .from("user_settings")
      .update(updates)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (settingsError) throw new Error(getAuthErrorMessage(settingsError));
    setSettings(data);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      settings,
      loading,
      error,
      configured: isSupabaseConfigured,
      signIn,
      register,
      signOut,
      updateUsername,
      updatePassword,
      updateProfile,
      updateSettings,
      refreshAccount
    }),
    [
      error,
      loading,
      profile,
      refreshAccount,
      register,
      settings,
      signIn,
      signOut,
      updateUsername,
      updatePassword,
      updateProfile,
      updateSettings,
      user
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

