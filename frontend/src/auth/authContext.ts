import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
  error: string;
  configured: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
