import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  getUsernameValidationMessage,
  isValidUsername,
  normalizeUsername,
  usernameToAuthEmail
} from "./usernameAuth";
import { AuthContext, type AuthContextValue, type Profile, type UserSettings } from "./authContext";

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase();

    if (message.includes("email rate limit")) {
      return "Signup is blocked by Supabase's email rate limit. Turn off email confirmation in Supabase Auth, then wait for the current rate limit to reset.";
    }

    if (message.includes("invalid login credentials")) {
      return "Username or password is incorrect.";
    }

    if (message.includes("@rawtype.local")) {
      return error.message.replace(/[a-z0-9_]+@rawtype\.local/gi, "this username");
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
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

  const signIn = useCallback(async (username: string, password: string) => {
    if (!isValidUsername(username)) {
      throw new Error(getUsernameValidationMessage(username));
    }

    const client = requireSupabaseClient();
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: usernameToAuthEmail(username),
      password
    });

    if (signInError) throw new Error(getAuthErrorMessage(signInError));
    await loadAccount(data.user);
  }, [loadAccount]);

  const register = useCallback(async (username: string, password: string) => {
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
      email: usernameToAuthEmail(normalizedUsername),
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
      refreshAccount
    }),
    [error, loading, profile, refreshAccount, register, settings, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
