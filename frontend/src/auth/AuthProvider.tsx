import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
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
    return "Something went wrong. Please try again.";
  }

  const message = rawMessage.toLowerCase();

  if (message.includes("email rate limit")) {
    return "Signup is blocked by Supabase's email rate limit. Turn off email confirmation in Supabase Auth, then wait for the current rate limit to reset.";
  }

  if (message.includes("invalid login credentials")) {
    return "Username or password is incorrect.";
  }

  return rawMessage;
}

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
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
  if (!data) throw new Error("This username is already taken.");
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
      setError(sessionError.message);
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
        if (sessionError) setError(sessionError.message);
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

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      throw new Error("Please enter a valid email address.");
    }
    if (password.length === 0) {
      throw new Error("Password is required.");
    }

    const client = requireSupabaseClient();
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (signInError) throw new Error(getAuthErrorMessage(signInError));
    await loadAccount(data.user);
  }, [loadAccount]);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!isValidUsername(username)) {
      throw new Error(getUsernameValidationMessage(username));
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
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
    if (!user || !profile?.username) {
      throw new Error("Account profile is not loaded.");
    }

    const normalizedUsername = normalizeUsername(nextUsername);

    if (!isValidUsername(normalizedUsername)) {
      throw new Error(getUsernameValidationMessage(normalizedUsername));
    }
    if (currentPassword.length === 0) {
      throw new Error("Current password is required.");
    }
    if (normalizedUsername === normalizeUsername(profile.username)) {
      return;
    }

    await ensureUsernameAvailable(normalizedUsername);

    const currentAuthEmail = normalizeEmail(user.email ?? "");

    if (!isValidEmail(currentAuthEmail)) {
      throw new Error("Current account email is missing or invalid.");
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
    if (!user) {
      throw new Error("Account user is not loaded.");
    }
    if (currentPassword.length === 0) {
      throw new Error("Current password is required.");
    }
    if (nextPassword.length < 8) {
      throw new Error("New password must be at least 8 characters.");
    }

    const currentAuthEmail = normalizeEmail(user.email ?? "");

    if (!isValidEmail(currentAuthEmail)) {
      throw new Error("Current account email is missing or invalid.");
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
