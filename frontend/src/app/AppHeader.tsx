// Top navigation for switching between RawType sections.
// Keeps the header markup separate from the app state container.
import logoMark from "../assets/branding/rawtype-logo-mark.png";
import type { getAppTexts } from "../i18n/messages";
import type { AppTab } from "./types";

type AppTexts = ReturnType<typeof getAppTexts>;

type AppHeaderProps = {
  activeTab: AppTab | null;
  accountLabel: string;
  appText: AppTexts;
  onSelectTab: (tab: AppTab) => void;
};

export default function AppHeader({ activeTab, accountLabel, appText, onSelectTab }: AppHeaderProps) {
  const headerTabs: Array<{ id: AppTab; label: string }> = [
    { id: "games", label: appText.tabs.games },
    { id: "stats", label: appText.tabs.stats },
    { id: "settings", label: appText.tabs.settings }
  ];

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
            gap: "12px",
            fontSize: "24px",
            letterSpacing: "0.4px",
            fontWeight: 700,
            color: "var(--text)",
            cursor: "pointer"
          }}
        >
          <img
            src={logoMark}
            alt=""
            width={36}
            height={36}
            style={{
              display: "block",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              objectFit: "cover"
            }}
          />
          <span
            style={{
              fontFamily: "var(--brand-font)",
              fontWeight: 400,
              fontSize: "30px",
              lineHeight: 1,
              letterSpacing: "0.02em"
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
        <button
          type="button"
          onClick={() => onSelectTab("account")}
          style={{
            marginLeft: "auto",
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
      </div>
    </header>
  );
}
