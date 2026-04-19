import { useState } from "react";
import TypingGame from "./games/typing/components/TypingGame";

type HeaderTab = "games" | "stats" | "account" | "settings";

const headerTabs: Array<{ id: HeaderTab; label: string }> = [
  { id: "games", label: "Games" },
  { id: "stats", label: "Stats" },
  { id: "account", label: "Account" },
  { id: "settings", label: "Settings" }
];

function App() {
  const [activeTab, setActiveTab] = useState<HeaderTab>("games");
  const [playingTypingGame, setPlayingTypingGame] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 15% 20%, #ffeab8 0%, #ffd580 30%, #f8f9fb 70%, #e6eef8 100%)",
        color: "#1c2736",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #d9e1ec"
        }}
      >
        <div
          style={{
            maxWidth: "980px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px"
          }}
        >
          <strong style={{ fontSize: "24px", letterSpacing: "0.4px" }}>RawType</strong>
          <nav style={{ display: "flex", gap: "10px" }}>
            {headerTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPlayingTypingGame(false);
                }}
                style={{
                  border: "1px solid #c5d3e4",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  backgroundColor: activeTab === tab.id ? "#1c2736" : "#ffffff",
                  color: activeTab === tab.id ? "#ffffff" : "#1c2736",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 24px 40px" }}>
        {activeTab === "games" && !playingTypingGame && (
          <section>
            <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "34px" }}>Start Menu</h1>
            <p style={{ marginTop: 0, maxWidth: "620px", color: "#415166", lineHeight: 1.5 }}>
              Pick a game and jump straight into a run. You can add more modes in this section
              later.
            </p>

            <div
              style={{
                marginTop: "22px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px"
              }}
            >
              <article
                style={{
                  border: "1px solid #c8d6e8",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  padding: "18px"
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>Typing Classic</h2>
                <p style={{ marginTop: 0, marginBottom: "14px", color: "#4d5d70", lineHeight: 1.45 }}>
                  Classic mode with live WPM and accuracy.
                </p>
                <button
                  type="button"
                  onClick={() => setPlayingTypingGame(true)}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    backgroundColor: "#2f9e44",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Start Game
                </button>
              </article>
            </div>
          </section>
        )}

        {activeTab === "games" && playingTypingGame && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1 style={{ margin: 0, fontSize: "30px" }}>Typing Classic</h1>
              <button
                type="button"
                onClick={() => setPlayingTypingGame(false)}
                style={{
                  border: "1px solid #bfcfe2",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  backgroundColor: "#ffffff",
                  cursor: "pointer"
                }}
              >
                Back to Start Menu
              </button>
            </div>
            <TypingGame />
          </section>
        )}

        {activeTab === "stats" && (
          <section
            style={{
              border: "1px solid #c8d6e8",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              padding: "20px"
            }}
          >
            <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>Stats</h1>
            <p style={{ marginTop: 0, color: "#4d5d70" }}>
              You will see your runs, personal bests, and accuracy history here.
            </p>
            <p style={{ marginBottom: 0, fontWeight: 600 }}>No saved sessions yet.</p>
          </section>
        )}

        {activeTab === "account" && (
          <section
            style={{
              border: "1px solid #c8d6e8",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              padding: "20px"
            }}
          >
            <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>Account</h1>
            <p style={{ marginTop: 0, color: "#4d5d70" }}>
              Account area for profile info and future cloud sync.
            </p>
            <p style={{ marginBottom: 0, fontWeight: 600 }}>Current status: Guest mode</p>
          </section>
        )}

        {activeTab === "settings" && (
          <section
            style={{
              border: "1px solid #c8d6e8",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              padding: "20px"
            }}
          >
            <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>Settings</h1>
            <p style={{ marginTop: 0, color: "#4d5d70" }}>
              Gameplay and display settings will live here.
            </p>
            <p style={{ marginBottom: 0, fontWeight: 600 }}>Current mode: Default</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
