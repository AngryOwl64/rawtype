import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/authContext";
import { getUsernameValidationMessage, normalizeUsername } from "../auth/usernameAuth";

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

export default function AccountPanel() {
  const { configured, loading, user, profile, signIn, register, signOut, error: accountError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedUsername = useMemo(() => normalizeUsername(username), [username]);
  const usernameHint = username.length > 0 ? getUsernameValidationMessage(username) : "";
  const title = user ? "Account" : mode === "login" ? "Login" : "Register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (usernameHint) {
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
        await signIn(normalizedUsername, password);
      } else {
        await register(normalizedUsername, password);
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

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        backgroundColor: "var(--surface)",
        padding: "20px",
        width: "min(100%, 520px)",
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
        <div style={{ display: "grid", gap: "14px" }}>
          <div>
            <div style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "4px" }}>Signed in as</div>
            <strong style={{ fontSize: "22px" }}>{profile?.username ?? "Account"}</strong>
          </div>

          {accountError && <p style={{ margin: 0, color: "var(--danger)" }}>{accountError}</p>}
          {formError && <p style={{ margin: 0, color: "var(--danger)" }}>{formError}</p>}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={submitting}
            style={{
              ...buttonStyle,
              backgroundColor: submitting ? "var(--border-strong)" : "var(--primary)"
            }}
          >
            {submitting ? "Signing out..." : "Logout"}
          </button>
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

            <p style={{ margin: 0, color: usernameHint ? "var(--danger)" : "var(--muted)", fontSize: "13px" }}>
              {usernameHint || "Username only. Use 3-20 letters, numbers, or underscores."}
            </p>

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
