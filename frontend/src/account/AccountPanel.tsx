import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "../auth/authContext";
import { getUsernameValidationMessage, normalizeUsername } from "../auth/usernameAuth";
import { fetchTypingStats } from "../games/typing/services/runResults";
import type { SavedTypingStats } from "../games/typing/types";

type AuthMode = "login" | "register";
type ActionState = "idle" | "saving" | "saved";

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

function formatDate(value: string | null | undefined): string {
  if (!value) return "New account";

  return new Intl.DateTimeFormat("en", {
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

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ ...subtleCardStyle, display: "grid", gap: "12px" }}>
      <h2 style={{ margin: 0, fontSize: "20px" }}>{title}</h2>
      {children}
    </section>
  );
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

export default function AccountPanel() {
  const {
    configured,
    loading,
    user,
    profile,
    signIn,
    register,
    signOut,
    updateUsername,
    updatePassword,
    updateProfile,
    refreshAccount,
    error: accountError
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accountUsername, setAccountUsername] = useState(profile?.username ?? "");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameState, setUsernameState] = useState<ActionState>("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextPasswordConfirm, setNextPasswordConfirm] = useState("");
  const [passwordState, setPasswordState] = useState<ActionState>("idle");
  const [visibilityState, setVisibilityState] = useState<ActionState>("idle");
  const [visibilityConfirmationOpen, setVisibilityConfirmationOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const normalizedUsername = useMemo(() => normalizeUsername(username), [username]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedAccountUsername = useMemo(() => normalizeUsername(accountUsername), [accountUsername]);
  const usernameHint =
    mode === "register" && username.length > 0 ? getUsernameValidationMessage(username) : "";
  const accountUsernameHint =
    accountUsername.length > 0 ? getUsernameValidationMessage(accountUsername) : "";
  const title = user ? "Account" : mode === "login" ? "Login" : "Register";
  const displayUsername = profile?.username || "Account";
  const accountCreated = formatDate(profile?.created_at ?? user?.created_at);
  const publicProfile = profile?.public_profile ?? false;
  const usernameChanged = normalizedAccountUsername !== (profile?.username ?? "");

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;
      setAccountUsername(profile?.username ?? "");
      setUsernamePassword("");
      setUsernameState("idle");
    });

    return () => {
      active = false;
    };
  }, [profile?.username]);

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
        setStatsError(error instanceof Error ? error.message : "Could not load account stats.");
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [configured, loading, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (normalizedEmail.length === 0) {
      setFormError("Email is required.");
      return;
    }
    if (mode === "register" && usernameHint) {
      setFormError(usernameHint);
      return;
    }
    if (password.length === 0) {
      setFormError("Password is required.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(normalizedEmail, password);
      } else {
        await register(normalizedEmail, normalizedUsername, password);
      }

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setFormError("");
    setSubmitting(true);

    try {
      await signOut();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (nextPassword !== nextPasswordConfirm) {
      setFormError("New passwords do not match.");
      return;
    }

    setPasswordState("saving");

    try {
      await updatePassword(currentPassword, nextPassword);
      setCurrentPassword("");
      setNextPassword("");
      setNextPasswordConfirm("");
      setPasswordState("saved");
    } catch (error) {
      setPasswordState("idle");
      setFormError(error instanceof Error ? error.message : "Could not change password.");
    }
  }

  async function handleUsernameSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (accountUsernameHint) {
      setFormError(accountUsernameHint);
      return;
    }
    if (usernamePassword.length === 0) {
      setFormError("Current password is required.");
      return;
    }

    setUsernameState("saving");

    try {
      await updateUsername(normalizedAccountUsername, usernamePassword);
      setUsernamePassword("");
      setUsernameState("saved");
    } catch (error) {
      setUsernameState("idle");
      setFormError(error instanceof Error ? error.message : "Could not update username.");
    }
  }

  async function handleVisibilityChange(nextPublicProfile: boolean) {
    setFormError("");
    setVisibilityState("saving");

    if (!profile) {
      setVisibilityState("idle");
      setFormError(
        "Your profile row is missing in the database. Run frontend/supabase/backfill_existing_auth_accounts.sql once, then refresh account."
      );
      return;
    }

    try {
      await updateProfile({ public_profile: nextPublicProfile });
      setVisibilityState("saved");
    } catch (error) {
      setVisibilityState("idle");
      setFormError(error instanceof Error ? error.message : "Could not update profile visibility.");
    }
  }

  function handleVisibilityClick() {
    if (publicProfile) {
      void handleVisibilityChange(false);
      return;
    }

    setVisibilityConfirmationOpen(true);
  }

  function handleConfirmPublicProfile() {
    setVisibilityConfirmationOpen(false);
    void handleVisibilityChange(true);
  }

  async function handleRefreshAccount() {
    setFormError("");
    setRefreshing(true);

    try {
      await refreshAccount();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not refresh account.");
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
          Supabase is not configured. Add your Vite Supabase environment variables first.
        </p>
      )}

      {configured && loading && <p style={{ marginBottom: 0, color: "var(--muted)" }}>Loading account...</p>}

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
                  Signed in as
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
                  Member since {accountCreated}
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
              <StatusPill>Synced</StatusPill>
              <StatusPill>{publicProfile ? "Public" : "Private"}</StatusPill>
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
                {refreshing ? "Refreshing..." : "Refresh Account"}
              </button>
            </div>
          </div>

          {accountError && <p style={{ margin: 0, color: "var(--danger)" }}>{accountError}</p>}
          {formError && <p style={{ margin: 0, color: "var(--danger)" }}>{formError}</p>}
          {statsError && <p style={{ margin: 0, color: "var(--danger)" }}>{statsError}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            <InfoTile label="Runs" value={statsLoading ? "..." : stats.totalRuns} />
            <InfoTile label="Best WPM" value={statsLoading ? "..." : stats.bestWpm} />
            <InfoTile label="Accuracy" value={statsLoading ? "..." : `${stats.averageAccuracy}%`} />
            <InfoTile label="Streak" value={statsLoading ? "..." : `${stats.currentStreakDays}d`} />
            <InfoTile label="Practice" value={statsLoading ? "..." : formatDuration(stats.totalDurationMs)} />
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            <SectionCard title="Account Settings">
              <form
                onSubmit={handleUsernameSave}
                style={{
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "var(--surface)",
                  display: "grid",
                  gap: "10px"
                }}
              >
                <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
                  <span style={{ fontSize: "13px" }}>Username</span>
                  <input
                    value={accountUsername}
                    onChange={(event) => {
                      setAccountUsername(event.target.value);
                      setUsernameState("idle");
                    }}
                    autoCapitalize="none"
                    spellCheck={false}
                    style={fieldStyle}
                  />
                </label>
                <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
                  <span style={{ fontSize: "13px" }}>Current Password</span>
                  <input
                    value={usernamePassword}
                    onChange={(event) => {
                      setUsernamePassword(event.target.value);
                      setUsernameState("idle");
                    }}
                    type="password"
                    autoComplete="current-password"
                    style={fieldStyle}
                  />
                </label>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px", lineHeight: 1.45 }}>
                  After changing username, use the new username for login.
                </p>
                {accountUsernameHint && (
                  <p style={{ margin: 0, color: "var(--danger)", fontSize: "13px", lineHeight: 1.45 }}>
                    {accountUsernameHint}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    usernameState === "saving" ||
                    !usernameChanged ||
                    accountUsernameHint.length > 0 ||
                    usernamePassword.length === 0
                  }
                  style={{
                    ...buttonStyle,
                    backgroundColor:
                      usernameState === "saving" ||
                      !usernameChanged ||
                      accountUsernameHint.length > 0 ||
                      usernamePassword.length === 0
                        ? "var(--border-strong)"
                        : "var(--primary)"
                  }}
                >
                  {usernameState === "saving"
                    ? "Updating..."
                    : usernameState === "saved"
                      ? "Username Updated"
                      : "Update Username"}
                </button>
              </form>

              <div
                style={{
                  borderTop: "1px solid var(--border-soft)",
                  paddingTop: "12px",
                  display: "grid",
                  gap: "10px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <strong>Profile Visibility</strong>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px", lineHeight: 1.45 }}>
                      Public profiles can be used by profile pages to show your saved typing stats.
                    </p>
                  </div>
                  <StatusPill>{publicProfile ? "Public" : "Private"}</StatusPill>
                </div>

                <button
                  type="button"
                  onClick={handleVisibilityClick}
                  disabled={visibilityState === "saving"}
                  style={{
                    ...buttonStyle,
                    backgroundColor:
                      visibilityState === "saving"
                        ? "var(--border-strong)"
                        : publicProfile
                          ? "var(--surface)"
                          : "var(--primary)",
                    color: publicProfile ? "var(--text)" : "var(--primary-text)",
                    border: publicProfile ? "1px solid var(--border-strong)" : "none"
                  }}
                >
                  {visibilityState === "saving"
                    ? "Updating..."
                    : publicProfile
                      ? "Make Profile Private"
                      : "Make Profile Public"}
                </button>
              </div>

              <form
                onSubmit={handlePasswordSave}
                style={{
                  borderTop: "1px solid var(--border-soft)",
                  paddingTop: "12px",
                  display: "grid",
                  gap: "10px"
                }}
              >
                <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
                  <span style={{ fontSize: "13px" }}>Current Password</span>
                  <input
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setPasswordState("idle");
                    }}
                    type="password"
                    autoComplete="current-password"
                    style={fieldStyle}
                  />
                </label>
                <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
                  <span style={{ fontSize: "13px" }}>New Password</span>
                  <input
                    value={nextPassword}
                    onChange={(event) => {
                      setNextPassword(event.target.value);
                      setPasswordState("idle");
                    }}
                    type="password"
                    autoComplete="new-password"
                    style={fieldStyle}
                  />
                </label>
                <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
                  <span style={{ fontSize: "13px" }}>Confirm New Password</span>
                  <input
                    value={nextPasswordConfirm}
                    onChange={(event) => {
                      setNextPasswordConfirm(event.target.value);
                      setPasswordState("idle");
                    }}
                    type="password"
                    autoComplete="new-password"
                    style={fieldStyle}
                  />
                </label>
                <button
                  type="submit"
                  disabled={
                    passwordState === "saving" ||
                    currentPassword.length === 0 ||
                    nextPassword.length === 0 ||
                    nextPasswordConfirm.length === 0
                  }
                  style={{
                    ...buttonStyle,
                    backgroundColor:
                      passwordState === "saving" ||
                      currentPassword.length === 0 ||
                      nextPassword.length === 0 ||
                      nextPasswordConfirm.length === 0
                        ? "var(--border-strong)"
                        : "var(--primary)"
                  }}
                >
                  {passwordState === "saving"
                    ? "Changing..."
                    : passwordState === "saved"
                      ? "Password Changed"
                      : "Change Password"}
                </button>
              </form>

              <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "12px", display: "grid", gap: "8px" }}>
                <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
                  <span style={{ fontSize: "13px" }}>Email Address</span>
                  <input value={user?.email ?? "No email connected"} readOnly disabled style={fieldStyle} />
                </label>
                <button
                  type="button"
                  disabled
                  style={{ ...secondaryButtonStyle, cursor: "not-allowed", opacity: 0.72 }}
                >
                  Change Email Unavailable
                </button>
              </div>
            </SectionCard>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={submitting}
            style={{
              ...buttonStyle,
              backgroundColor: submitting ? "var(--border-strong)" : "var(--danger)"
            }}
          >
            {submitting ? "Signing out..." : "Logout"}
          </button>

          {visibilityConfirmationOpen && (
            <div
              role="presentation"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                backgroundColor: "rgba(0, 0, 0, 0.42)",
                display: "grid",
                placeItems: "center",
                padding: "20px"
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="public-profile-title"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                  padding: "18px",
                  width: "min(100%, 420px)",
                  boxSizing: "border-box",
                  boxShadow: "0 18px 48px rgba(0, 0, 0, 0.28)",
                  display: "grid",
                  gap: "12px"
                }}
              >
                <h2 id="public-profile-title" style={{ margin: 0, fontSize: "22px" }}>
                  Make Profile Public?
                </h2>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
                  Are you sure you want to do this? After this, other people can see your public profile and saved
                  typing stats.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setVisibilityConfirmationOpen(false)}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={handleConfirmPublicProfile} style={buttonStyle}>
                    Make Public
                  </button>
                </div>
              </section>
            </div>
          )}
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
                {nextMode === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
            <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                placeholder="name@example.com"
                spellCheck={false}
                style={fieldStyle}
              />
            </label>

            {mode === "register" && (
              <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                Username
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
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={fieldStyle}
              />
            </label>

            {mode === "register" && (
              <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                Confirm password
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
                {usernameHint || "Username only. Use 3-20 letters, numbers, or underscores."}
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
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
