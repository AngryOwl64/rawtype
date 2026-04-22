import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type UserSettingsUpdate = Database["public"]["Tables"]["user_settings"]["Update"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
  error: string;
  configured: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (nextUsername: string, currentPassword: string) => Promise<void>;
  updatePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  updateProfile: (profile: ProfileUpdate) => Promise<void>;
  updateSettings: (settings: UserSettingsUpdate) => Promise<void>;
  refreshAccount: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
