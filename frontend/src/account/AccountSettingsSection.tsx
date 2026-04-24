import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "../auth/authContext";
import { getUsernameValidationMessage, normalizeUsername } from "../auth/usernameAuth";
import type { TypingLanguage } from "../games/typing/types";
import { translateAccountText } from "../i18n/messages";

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

export default function AccountSettingsSection({ language = "en" }: { language?: TypingLanguage }) {
  const t = useMemo(() => (en: string) => translateAccountText(language, en), [language]);
  const {
    error: accountError,
    profile,
    signOut,
    updatePassword,
    updateProfile,
    updateUsername,
    user
  } = useAuth();
  const [formError, setFormError] = useState("");
  const [accountUsername, setAccountUsername] = useState(profile?.username ?? "");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameState, setUsernameState] = useState<ActionState>("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextPasswordConfirm, setNextPasswordConfirm] = useState("");
  const [passwordState, setPasswordState] = useState<ActionState>("idle");
  const [visibilityState, setVisibilityState] = useState<ActionState>("idle");
  const [visibilityConfirmationOpen, setVisibilityConfirmationOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const normalizedAccountUsername = useMemo(() => normalizeUsername(accountUsername), [accountUsername]);
  const accountUsernameHint =
    accountUsername.length > 0 ? getUsernameValidationMessage(accountUsername, language) : "";
  const publicProfile = profile?.public_profile ?? false;
  const publicProfilePath = profile?.username ? `/${profile.username}` : null;
  const publicProfileUrl = publicProfilePath ? `${window.location.origin}${publicProfilePath}` : null;
  const usernameChanged = normalizedAccountUsername !== (profile?.username ?? "");

  useEffect(() => {
    setAccountUsername(profile?.username ?? "");
    setUsernamePassword("");
    setUsernameState("idle");
  }, [profile?.username]);

  async function handleUsernameSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (accountUsernameHint) {
      setFormError(accountUsernameHint);
      return;
    }
    if (usernamePassword.length === 0) {
      setFormError(t("Current password is required."));
      return;
    }

    setUsernameState("saving");

    try {
      await updateUsername(normalizedAccountUsername, usernamePassword);
      setUsernamePassword("");
      setUsernameState("saved");
    } catch (error) {
      setUsernameState("idle");
      setFormError(error instanceof Error ? error.message : t("Could not update username."));
    }
  }

  async function handlePasswordSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (nextPassword !== nextPasswordConfirm) {
      setFormError(t("New passwords do not match."));
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
      setFormError(error instanceof Error ? error.message : t("Could not change password."));
    }
  }

  async function handleVisibilityChange(nextPublicProfile: boolean) {
    setFormError("");
    setVisibilityState("saving");

    if (!profile) {
      setVisibilityState("idle");
      setFormError(
        t("Your profile row is missing in the database. Run frontend/supabase/backfill_existing_auth_accounts.sql once, then refresh account.")
      );
      return;
    }

    try {
      await updateProfile({ public_profile: nextPublicProfile });
      setVisibilityState("saved");
    } catch (error) {
      setVisibilityState("idle");
      setFormError(error instanceof Error ? error.message : t("Could not update profile visibility."));
    }
  }

  function handleVisibilityClick() {
    if (publicProfile) {
      void handleVisibilityChange(false);
      return;
    }

    setVisibilityConfirmationOpen(true);
  }

  async function handleSignOut() {
    setFormError("");
    setSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("Could not sign out."));
    } finally {
      setSigningOut(false);
    }
  }

  if (!user) {
    return (
      <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
        {t("Login to manage account settings.")}
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {(formError || accountError) && (
        <p style={{ margin: 0, color: "var(--danger)" }}>{formError || accountError}</p>
      )}

      <form onSubmit={handleUsernameSave} style={{ display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0, fontSize: "17px" }}>{t("Profile")}</h3>
        <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
          <span style={{ fontSize: "13px" }}>{t("Username")}</span>
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
          <span style={{ fontSize: "13px" }}>{t("Current Password")}</span>
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
          {t("After changing username, use the new username or your email for login.")}
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
            ? t("Updating...")
            : usernameState === "saved"
              ? t("Username Updated")
              : t("Update Username")}
        </button>
      </form>

      <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "12px", display: "grid", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px" }}>{t("Privacy")}</h3>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px", lineHeight: 1.45 }}>
              {t("Public profiles can be used by profile pages to show your saved typing stats.")}
            </p>
            {publicProfile && publicProfilePath && publicProfileUrl && (
              <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "13px", lineHeight: 1.45 }}>
                {t("Public URL")}:{" "}
                <a href={publicProfilePath} style={{ color: "var(--primary)" }}>
                  {publicProfileUrl}
                </a>
              </p>
            )}
          </div>
          <StatusPill>{publicProfile ? t("Public") : t("Private")}</StatusPill>
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
            ? t("Updating...")
            : publicProfile
              ? t("Make Profile Private")
              : t("Make Profile Public")}
        </button>
      </div>

      <form onSubmit={handlePasswordSave} style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "12px", display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0, fontSize: "17px" }}>{t("Security")}</h3>
        <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
          <span style={{ fontSize: "13px" }}>{t("Current Password")}</span>
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
          <span style={{ fontSize: "13px" }}>{t("New Password")}</span>
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
          <span style={{ fontSize: "13px" }}>{t("Confirm New Password")}</span>
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
            ? t("Changing...")
            : passwordState === "saved"
              ? t("Password Changed")
              : t("Change Password")}
        </button>
      </form>

      <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "12px", display: "grid", gap: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "17px" }}>{t("Account")}</h3>
        <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
          <span style={{ fontSize: "13px" }}>{t("Email Address")}</span>
          <input value={user.email ?? t("No email connected")} readOnly disabled style={fieldStyle} />
        </label>
        <button type="button" disabled style={{ ...secondaryButtonStyle, cursor: "not-allowed", opacity: 0.72 }}>
          {t("Change Email Unavailable")}
        </button>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          style={{
            ...buttonStyle,
            backgroundColor: signingOut ? "var(--border-strong)" : "var(--danger)"
          }}
        >
          {signingOut ? t("Signing out...") : t("Logout")}
        </button>
      </div>

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
              {t("Make Profile Public?")}
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
              {t("Are you sure you want to do this? After this, other people can see your public profile and saved typing stats.")}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setVisibilityConfirmationOpen(false)}
                style={secondaryButtonStyle}
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setVisibilityConfirmationOpen(false);
                  void handleVisibilityChange(true);
                }}
                style={buttonStyle}
              >
                {t("Make Public")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
