import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/authContext";
import { getUsernameValidationMessage, normalizeUsername } from "../auth/usernameAuth";

type AuthMode = "login" | "register";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #c5d3e4",
  borderRadius: "8px",
  padding: "10px 12px",
  backgroundColor: "#ffffff",
  color: "#1c2736",
  fontSize: "15px"
};

const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  backgroundColor: "#1c2736",
  color: "#ffffff",
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
        border: "1px solid #c8d6e8",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        padding: "20px",
        width: "min(100%, 520px)",
        boxSizing: "border-box",
        margin: "34px auto 0"
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>{title}</h1>

      {!configured && (
        <p style={{ margin: 0, color: "#9f3e4d", lineHeight: 1.5 }}>
          Supabase is not configured. Add your Vite Supabase environment variables first.
        </p>
      )}

      {configured && loading && <p style={{ marginBottom: 0, color: "#4d5d70" }}>Loading account...</p>}

      {configured && !loading && user && (
        <div style={{ display: "grid", gap: "14px" }}>
          <div>
            <div style={{ color: "#5a6b80", fontSize: "13px", marginBottom: "4px" }}>Signed in as</div>
            <strong style={{ fontSize: "22px" }}>{profile?.username ?? "Account"}</strong>
          </div>

          {accountError && <p style={{ margin: 0, color: "#9f3e4d" }}>{accountError}</p>}
          {formError && <p style={{ margin: 0, color: "#9f3e4d" }}>{formError}</p>}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={submitting}
            style={{
              ...buttonStyle,
              backgroundColor: submitting ? "#7d8da1" : "#1c2736"
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
                  border: "1px solid #c5d3e4",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  backgroundColor: mode === nextMode ? "#1c2736" : "#ffffff",
                  color: mode === nextMode ? "#ffffff" : "#1c2736",
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

            <p style={{ margin: 0, color: usernameHint ? "#9f3e4d" : "#5a6b80", fontSize: "13px" }}>
              {usernameHint || "Username only. Use 3-20 letters, numbers, or underscores."}
            </p>

            {(formError || accountError) && (
              <p style={{ margin: 0, color: "#9f3e4d" }}>{formError || accountError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...buttonStyle,
                marginTop: "4px",
                backgroundColor: submitting ? "#7d8da1" : "#1c2736"
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
