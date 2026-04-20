import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import AccountPanel from "./account/AccountPanel";
import { useAuth } from "./auth/authContext";
import TypingGame from "./games/typing/components/TypingGame";
import type { TypingMode, WordModeDifficulty, WordNoMistakeMode } from "./games/typing/types";
import SettingsPanel from "./settings/SettingsPanel";
import StatsPanel from "./stats/StatsPanel";

type HeaderTab = "games" | "stats" | "account" | "settings";
type ThemeMode = "light" | "dark";

const headerTabs: Array<{ id: HeaderTab; label: string }> = [
  { id: "games", label: "Games" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" }
];

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem("rawtype-theme") === "dark" ? "dark" : "light";
}

function getThemeVariables(theme: ThemeMode): CSSProperties {
  const dark = theme === "dark";

  return {
    "--page-bg": dark ? "#272822" : "#ece8df",
    "--header-bg": dark ? "rgba(39, 40, 34, 0.96)" : "rgba(244, 239, 229, 0.94)",
    "--text": dark ? "#f8f8f2" : "#232a33",
    "--muted": dark ? "#a8a8a3" : "#5e6670",
    "--muted-strong": dark ? "#f8f8f2" : "#38414d",
    "--surface": dark ? "#313327" : "#f7f4ee",
    "--surface-soft": dark ? "#3e3d32" : "#f1ece4",
    "--input-bg": dark ? "#3b3a32" : "#fdfaf3",
    "--input-muted": dark ? "#46463b" : "#ece6dc",
    "--border": dark ? "#4c4b42" : "#c4c0b7",
    "--border-soft": dark ? "#3f3e35" : "#d7d2c8",
    "--border-strong": dark ? "#59574d" : "#a8b0b8",
    "--primary": dark ? "#66d9ef" : "#2f3742",
    "--primary-text": dark ? "#272822" : "#f8fafc",
    "--success": dark ? "#a6e22e" : "#3b7b4f",
    "--danger": dark ? "#f92672" : "#8f4a54",
    "--danger-bg": dark ? "#3a2030" : "#f3e7e8",
    "--danger-border": dark ? "#6b3853" : "#d7c3c6"
  } as CSSProperties;
}

function App() {
  const { loading: authLoading, profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<HeaderTab>("games");
  const [playingTypingGame, setPlayingTypingGame] = useState(false);
  const [typingMode, setTypingMode] = useState<TypingMode>("sentences");
  const [wordsCount, setWordsCount] = useState(25);
  const [wordDifficulty, setWordDifficulty] = useState<WordModeDifficulty>("mixed");
  const [wordNoMistakeMode, setWordNoMistakeMode] = useState<WordNoMistakeMode>("off");
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const accountLabel = authLoading ? "Account" : user ? profile?.username ?? "Account" : "Login";
  const themeVariables = getThemeVariables(theme);

  useEffect(() => {
    window.localStorage.setItem("rawtype-theme", theme);
  }, [theme]);

  return (
    <div
      data-theme={theme}
      style={{
        ...themeVariables,
        minHeight: "100vh",
        background: "var(--page-bg)",
        color: "var(--text)",
        fontFamily: "'Segoe UI', 'Aptos', 'Trebuchet MS', sans-serif"
      }}
    >
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
            onClick={() => {
              setActiveTab("games");
              setPlayingTypingGame(false);
            }}
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
                onClick={() => {
                  setActiveTab(tab.id);
                  setPlayingTypingGame(false);
                }}
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
            onClick={() => {
              setActiveTab("account");
              setPlayingTypingGame(false);
            }}
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

      <main style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 24px 40px" }}>
        {activeTab === "games" && !playingTypingGame && (
          <section>
            <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "34px" }}>Start Menu</h1>
             <div
              style={{
                marginTop: "22px",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "14px"
              }}
            >
              <article
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  backgroundColor: "var(--surface)",
                  padding: "18px"
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>Typing Classic</h2>
                <p style={{ marginTop: 0, marginBottom: "14px", color: "var(--muted)", lineHeight: 1.45 }}>
                  Standard prose mode with random text from the database.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setTypingMode("sentences");
                    setPlayingTypingGame(true);
                  }}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    width: "100%",
                    backgroundColor: "var(--success)",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Start Typing Classic
                </button>
              </article>

              <article
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  backgroundColor: "var(--surface)",
                  padding: "18px"
                }}
              >
                <div
                  style={{
                    marginBottom: "14px",
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gridTemplateRows: "auto auto",
                    gap: "10px"
                  }}
                >
                  <div
                    style={{
                      gridColumn: "1",
                      gridRow: "1",
                      fontSize: "18px",
                      color: "var(--text)",
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <span>Word Mode</span>
                    <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 400 }}>
                      Random words generated.
                    </span>
                  </div>

                  <div style={{ gridColumn: "2", gridRow: "1" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        marginBottom: "6px",
                        fontWeight: 600
                      }}
                    >
                      No Mistake Mode
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wordNoMistakeMode === "on"}
                      onClick={() =>
                        setWordNoMistakeMode((prev) => (prev === "on" ? "off" : "on"))
                      }
                      style={{
                        width: "100%",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        backgroundColor: "var(--surface)",
                        color: "var(--text)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>{wordNoMistakeMode === "on" ? "on" : "off"}</span>
                      <span
                        style={{
                          width: "42px",
                          height: "24px",
                          borderRadius: "999px",
                          backgroundColor: wordNoMistakeMode === "on" ? "var(--success)" : "var(--border-strong)",
                          position: "relative",
                          transition: "background-color 120ms ease"
                        }}
                      >
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "999px",
                            backgroundColor: "var(--surface)",
                            position: "absolute",
                            top: "3px",
                            left: wordNoMistakeMode === "on" ? "21px" : "3px",
                            transition: "left 120ms ease"
                          }}
                        />
                      </span>
                    </button>
                  </div>

                  <div style={{ gridColumn: "1", gridRow: "2" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        marginBottom: "6px",
                        fontWeight: 600
                      }}
                    >
                      Words
                    </div>
                    <select
                      value={wordsCount}
                      onChange={(event) => setWordsCount(Number(event.target.value))}
                      style={{
                        width: "100%",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        backgroundColor: "var(--input-bg)",
                        color: "var(--text)",
                        fontWeight: 600
                      }}
                    >
                      <option value={10}>10 words</option>
                      <option value={25}>25 words</option>
                      <option value={50}>50 words</option>
                      <option value={75}>75 words</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: "2", gridRow: "2" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        marginBottom: "6px",
                        fontWeight: 600
                      }}
                    >
                      Difficulty
                    </div>
                    <select
                      value={wordDifficulty}
                      onChange={(event) => setWordDifficulty(event.target.value as WordModeDifficulty)}
                      style={{
                        width: "100%",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        backgroundColor: "var(--input-bg)",
                        color: "var(--text)",
                        fontWeight: 600
                      }}
                    >
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                      <option value="mixed">mixed</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTypingMode("words");
                    setPlayingTypingGame(true);
                  }}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    width: "100%",
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-text)",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Start Word Mode
                </button>
              </article>
            </div>
          </section>
        )}

        {activeTab === "games" && playingTypingGame && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1 style={{ margin: 0, fontSize: "30px" }}>
                Typing Classic{" "}
                {typingMode === "words"
                  ? `(Words ${wordsCount}, ${wordDifficulty}, no-mistake ${wordNoMistakeMode})`
                  : "(Prose)"}
              </h1>
              <button
                type="button"
                onClick={() => setPlayingTypingGame(false)}
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer"
                }}
              >
                Back to Start Menu
              </button>
            </div>
            <TypingGame
              mode={typingMode}
              wordsCount={wordsCount}
              wordDifficulty={wordDifficulty}
              wordNoMistakeMode={wordNoMistakeMode}
            />
          </section>
        )}

        {activeTab === "stats" && <StatsPanel />}

        {activeTab === "account" && <AccountPanel />}

        {activeTab === "settings" && (
          <SettingsPanel darkMode={theme === "dark"} onDarkModeChange={(enabled) => setTheme(enabled ? "dark" : "light")} />
        )}
      </main>
    </div>
  );
}

export default App;
