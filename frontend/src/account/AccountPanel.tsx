// Account screen for login, profile display, and account actions.
// Handles the username/password flow used by RawType.
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "../auth/authContext";
import { getUsernameValidationMessage, normalizeUsername } from "../auth/usernameAuth";
import { fetchTypingStats } from "../games/typing/services/runResults";
import type { SavedTypingStats, TypingLanguage } from "../games/typing/types";
import { getLocaleForLanguage } from "../i18n/language";
import { translateAccountText } from "../i18n/messages";
import { getRememberSessionPreference } from "../lib/supabase";

type AuthMode = "login" | "register";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid var(--border-strong)",
  borderRadius: "8px",
  padding: "10px 12px",
  backgroundColor: "var(--input-bg)",
  color: "var(--text)",
  fontSize: "15px"
};

const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  backgroundColor: "var(--primary)",
  color: "var(--primary-text)",
  fontWeight: 700,
  cursor: "pointer"
};

const secondaryButtonStyle = {
  ...buttonStyle,
  border: "1px solid var(--border-strong)",
  backgroundColor: "var(--surface-soft)",
  color: "var(--text)"
};

const subtleCardStyle = {
  border: "1px solid var(--border-soft)",
  borderRadius: "8px",
  padding: "14px",
  backgroundColor: "var(--surface-soft)"
};

const emptyStats: Pick<
  SavedTypingStats,
  "totalRuns" | "bestWpm" | "averageAccuracy" | "currentStreakDays" | "totalDurationMs"
> = {
  totalRuns: 0,
  bestWpm: 0,
  averageAccuracy: 0,
  currentStreakDays: 0,
  totalDurationMs: 0
};

function formatDate(value: string | null | undefined, language: TypingLanguage): string {
  if (!value) return translateAccountText(language, "New account");

  return new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatDuration(totalMs: number): string {
  const totalMinutes = Math.round(totalMs / 60000);
  if (totalMinutes < 1) return "0m";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--border-soft)", borderRadius: "8px", padding: "12px" }}>
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "4px", fontWeight: 700 }}>
        {label}
      </div>
      <strong style={{ fontSize: "22px" }}>{value}</strong>
    </div>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: "999px",
        padding: "5px 10px",
        color: "var(--muted-strong)",
        backgroundColor: "var(--surface)",
        fontSize: "12px",
        fontWeight: 800
      }}
    >
      {children}
    </span>
  );
}

export default function AccountPanel({ language = "en" }: { language?: TypingLanguage }) {
  const t = useMemo(() => (en: string) => translateAccountText(language, en), [language]);

  const {
    configured,
    loading,
    user,
    profile,
    signIn,
    register,
    refreshAccount,
    error: accountError
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(() => getRememberSessionPreference());
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const normalizedUsername = useMemo(() => normalizeUsername(username), [username]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const usernameHint =
    mode === "register" && username.length > 0 ? getUsernameValidationMessage(username, language) : "";
  const title = user ? t("Account") : mode === "login" ? "Login" : t("Register");
  const displayUsername = profile?.username || t("Account");
  const accountCreated = formatDate(profile?.created_at ?? user?.created_at, language);
  const publicProfile = profile?.public_profile ?? false;

  useEffect(() => {
    if (!configured || loading || !user) {
      return;
    }

    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setStatsLoading(true);
        setStatsError("");
        return fetchTypingStats();
      })
      .then((nextStats) => {
        if (!active || !nextStats) return;
        setStats({
          totalRuns: nextStats.totalRuns,
          bestWpm: nextStats.bestWpm,
          averageAccuracy: nextStats.averageAccuracy,
          currentStreakDays: nextStats.currentStreakDays,
          totalDurationMs: nextStats.totalDurationMs
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatsError(
          error instanceof Error ? error.message : t("Could not load account stats.")
        );
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [configured, loading, t, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (normalizedEmail.length === 0) {
      setFormError(mode === "login" ? t("Username or email is required.") : t("Email is required."));
      return;
    }
    if (mode === "register" && usernameHint) {
      setFormError(usernameHint);
      return;
    }
    if (password.length === 0) {
      setFormError(t("Password is required."));
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setFormError(t("Passwords do not match."));
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(normalizedEmail, password, rememberSession);
      } else {
        await register(normalizedEmail, normalizedUsername, password);
      }

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("Authentication failed."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefreshAccount() {
    setFormError("");
    setRefreshing(true);

    try {
      await refreshAccount();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("Could not refresh account."));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        backgroundColor: "var(--surface)",
        padding: "20px",
        width: "min(100%, 840px)",
        boxSizing: "border-box",
        margin: "34px auto 0"
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>{title}</h1>

      {!configured && (
        <p style={{ margin: 0, color: "var(--danger)", lineHeight: 1.5 }}>
          {t("Supabase is not configured. Add your Vite Supabase environment variables first.")}
        </p>
      )}

      {configured && loading && (
        <p style={{ marginBottom: 0, color: "var(--muted)" }}>{t("Loading account...")}</p>
      )}

      {configured && !loading && user && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div
            style={{
              ...subtleCardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "18px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", gap: "14px", alignItems: "center", minWidth: 0 }}>
              <div
                aria-hidden="true"
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "999px",
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-text)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "20px",
                  fontWeight: 900,
                  flex: "0 0 auto"
                }}
              >
                {getInitials(profile?.username ?? "RT")}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "4px" }}>
                  {t("Signed in as")}
                </div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "26px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {displayUsername}
                </strong>
                <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
                  {t("Member since")} {accountCreated}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "flex-end"
              }}
            >
              <StatusPill>{t("Synced")}</StatusPill>
              <StatusPill>{publicProfile ? t("Public") : t("Private")}</StatusPill>
              <button
                type="button"
                onClick={() => void handleRefreshAccount()}
                disabled={refreshing}
                style={{
                  ...secondaryButtonStyle,
                  padding: "7px 11px",
                  backgroundColor: refreshing ? "var(--border-strong)" : "var(--surface)"
                }}
              >
                {refreshing ? t("Refreshing...") : t("Refresh Account")}
              </button>
            </div>
          </div>

          {accountError && <p style={{ margin: 0, color: "var(--danger)" }}>{accountError}</p>}
          {formError && <p style={{ margin: 0, color: "var(--danger)" }}>{formError}</p>}
          {statsError && <p style={{ margin: 0, color: "var(--danger)" }}>{statsError}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            <InfoTile label={t("Runs")} value={statsLoading ? "..." : stats.totalRuns} />
            <InfoTile label={t("Best WPM")} value={statsLoading ? "..." : stats.bestWpm} />
            <InfoTile label={t("Accuracy")} value={statsLoading ? "..." : `${stats.averageAccuracy}%`} />
            <InfoTile label={t("Streak")} value={statsLoading ? "..." : `${stats.currentStreakDays}d`} />
            <InfoTile label={t("Practice")} value={statsLoading ? "..." : formatDuration(stats.totalDurationMs)} />
          </div>

        </div>
      )}

      {configured && !loading && !user && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "18px"
            }}
          >
            {(["login", "register"] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => {
                  setMode(nextMode);
                  setFormError("");
                }}
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  backgroundColor: mode === nextMode ? "var(--primary)" : "var(--surface)",
                  color: mode === nextMode ? "var(--primary-text)" : "var(--text)",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {nextMode === "login" ? "Login" : t("Register")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
            <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
              {mode === "login" ? t("Username or Email") : t("Email")}
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type={mode === "login" ? "text" : "email"}
                autoComplete={mode === "login" ? "username" : "email"}
                autoCapitalize="none"
                placeholder={mode === "login" ? t("player_one or name@example.com") : t("name@example.com")}
                spellCheck={false}
                style={fieldStyle}
              />
            </label>

            {mode === "register" && (
              <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                {t("Username")}
                <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                placeholder="player_one"
                spellCheck={false}
                style={fieldStyle}
              />
              </label>
            )}

            <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                {t("Password")}
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={fieldStyle}
              />
            </label>

            {mode === "login" && (
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "fit-content",
                  fontWeight: 700
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                />
                <span>{t("Stay signed in")}</span>
              </label>
            )}

            {mode === "register" && (
              <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                {t("Confirm password")}
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  style={fieldStyle}
                />
              </label>
            )}

            {mode === "register" && (
              <p style={{ margin: 0, color: usernameHint ? "var(--danger)" : "var(--muted)", fontSize: "13px" }}>
                {usernameHint || t("Username only. Use 3-20 letters, numbers, or underscores.")}
              </p>
            )}

            {(formError || accountError) && (
              <p style={{ margin: 0, color: "var(--danger)" }}>{formError || accountError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...buttonStyle,
                marginTop: "4px",
                backgroundColor: submitting ? "var(--border-strong)" : "var(--primary)"
              }}
            >
              {submitting ? t("Please wait...") : mode === "login" ? "Login" : t("Create account")}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

