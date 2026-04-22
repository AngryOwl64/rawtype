import type { getAppTexts } from "../i18n/messages";
import type { AppTab } from "./types";

type AppTexts = ReturnType<typeof getAppTexts>;

type AppHeaderProps = {
  activeTab: AppTab;
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
            fontSize: "24px",
            letterSpacing: "0.4px",
            fontWeight: 700,
            color: "var(--text)",
            cursor: "pointer"
          }}
        >
          RawType
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
