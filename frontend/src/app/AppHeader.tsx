// Top navigation for switching between RawType sections.
// Keeps the header markup separate from the app state container.
import { useEffect, useRef, useState } from "react";
import { translateAccountText, type getAppTexts } from "../i18n/messages";
import type { TypingLanguage } from "../games/typing/types";
import type { SettingsCategory, SettingsCategoryItem } from "../settings/SettingsPanel";
import type { AppTab } from "./types";

type AppTexts = ReturnType<typeof getAppTexts>;

type AppHeaderProps = {
  activeTab: AppTab | null;
  accountLabel: string;
  appText: AppTexts;
  language: TypingLanguage;
  settingsCategories: SettingsCategoryItem[];
  signedIn: boolean;
  onSelectTab: (tab: AppTab) => void;
  onSelectSettingsCategory: (category: SettingsCategory) => void;
  onLogout: () => void;
};

export default function AppHeader({
  activeTab,
  accountLabel,
  appText,
  language,
  settingsCategories,
  signedIn,
  onSelectTab,
  onSelectSettingsCategory,
  onLogout
}: AppHeaderProps) {
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountText = (en: string) => translateAccountText(language, en);
  const headerTabs: Array<{ id: AppTab; label: string }> = [
    { id: "games", label: appText.tabs.games },
    { id: "stats", label: appText.tabs.stats }
  ];

  useEffect(() => {
    if (!settingsMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!settingsMenuRef.current?.contains(event.target as Node)) {
        setSettingsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsMenuOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backgroundColor: "var(--header-bg)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)"
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "24px"
        }}
      >
        <button
          type="button"
          onClick={() => onSelectTab("games")}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            margin: 0,
            display: "flex",
            alignItems: "center",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text)",
            cursor: "pointer"
          }}
          aria-label="RawType home"
        >
          <span
            style={{
              fontFamily: "var(--brand-font)",
              fontWeight: 400,
              fontSize: "30px",
              lineHeight: 1,
              letterSpacing: 0
            }}
          >
            RawType
          </span>
        </button>
        <nav style={{ display: "flex", gap: "10px" }}>
          {headerTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              style={{
                border: "1px solid var(--border-strong)",
                borderRadius: "8px",
                padding: "8px 14px",
                backgroundColor: activeTab === tab.id ? "var(--primary)" : "var(--surface)",
                color: activeTab === tab.id ? "var(--primary-text)" : "var(--text)",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <div ref={settingsMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setSettingsMenuOpen((open) => !open)}
            aria-label={appText.tabs.settings}
            aria-expanded={settingsMenuOpen}
            aria-haspopup="menu"
            title={appText.tabs.settings}
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              width: "38px",
              height: "38px",
              padding: 0,
              backgroundColor: activeTab === "settings" ? "var(--primary)" : "var(--surface)",
              color: activeTab === "settings" ? "var(--primary-text)" : "var(--text)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center"
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 0 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7.2 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 20 7.2l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.8.8Z" />
            </svg>
          </button>

          {settingsMenuOpen && (
            <div
              role="menu"
              aria-label={appText.tabs.settings}
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "210px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                boxShadow: "0 18px 44px rgba(0, 0, 0, 0.18)",
                padding: "8px",
                display: "grid",
                gap: "4px",
                zIndex: 50
              }}
            >
              {settingsCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectSettingsCategory(category.id);
                    setSettingsMenuOpen(false);
                  }}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 11px",
                    backgroundColor: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: 700
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          )}
          </div>

        <div ref={accountMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              if (!signedIn) {
                onSelectTab("account");
                return;
              }

              setAccountMenuOpen((open) => !open);
            }}
            aria-expanded={signedIn ? accountMenuOpen : undefined}
            aria-haspopup={signedIn ? "menu" : undefined}
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              padding: "8px 14px",
              backgroundColor: activeTab === "account" ? "var(--primary)" : "var(--surface)",
              color: activeTab === "account" ? "var(--primary-text)" : "var(--text)",
              cursor: "pointer",
              fontWeight: 600,
              maxWidth: "180px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {accountLabel}
          </button>

          {accountMenuOpen && signedIn && (
            <div
              role="menu"
              aria-label={accountText("Account")}
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "180px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                boxShadow: "0 18px 44px rgba(0, 0, 0, 0.18)",
                padding: "8px",
                display: "grid",
                gap: "4px",
                zIndex: 50
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectTab("account");
                  setAccountMenuOpen(false);
                }}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 11px",
                  backgroundColor: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: 700
                }}
              >
                {accountText("View Profile")}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onLogout();
                  setAccountMenuOpen(false);
                }}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 11px",
                  backgroundColor: "transparent",
                  color: "var(--danger)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: 800
                }}
              >
                {accountText("Logout")}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
