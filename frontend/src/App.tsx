import { useState } from "react";
import AccountPanel from "./account/AccountPanel";
import { useAuth } from "./auth/authContext";
import TypingGame from "./games/typing/components/TypingGame";
import type { TypingMode, WordModeDifficulty, WordNoMistakeMode } from "./games/typing/types";

type HeaderTab = "games" | "stats" | "account" | "settings";

const headerTabs: Array<{ id: HeaderTab; label: string }> = [
  { id: "games", label: "Games" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" }
];

function App() {
  const { loading: authLoading, profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<HeaderTab>("games");
  const [playingTypingGame, setPlayingTypingGame] = useState(false);
  const [typingMode, setTypingMode] = useState<TypingMode>("sentences");
  const [wordsCount, setWordsCount] = useState(25);
  const [wordDifficulty, setWordDifficulty] = useState<WordModeDifficulty>("mixed");
  const [wordNoMistakeMode, setWordNoMistakeMode] = useState<WordNoMistakeMode>("off");
  const accountLabel = authLoading ? "Account" : user ? profile?.username ?? "Account" : "Login";

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
              color: "#1c2736",
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
          <button
            type="button"
            onClick={() => {
              setActiveTab("account");
              setPlayingTypingGame(false);
            }}
            style={{
              marginLeft: "auto",
              border: "1px solid #c5d3e4",
              borderRadius: "8px",
              padding: "8px 14px",
              backgroundColor: activeTab === "account" ? "#1c2736" : "#ffffff",
              color: activeTab === "account" ? "#ffffff" : "#1c2736",
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
            <p style={{ marginTop: 0, maxWidth: "620px", color: "#415166", lineHeight: 1.5 }}>
              Pick a game and jump straight into a run. You can add more modes in this section
              later.
            </p>

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
                  border: "1px solid #c8d6e8",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  padding: "18px"
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>Typing Classic</h2>
                <p style={{ marginTop: 0, marginBottom: "14px", color: "#4d5d70", lineHeight: 1.45 }}>
                  Standard mode with normal sentence texts from the database.
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
                    backgroundColor: "#2f9e44",
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
                  border: "1px solid #c8d6e8",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
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
                      color: "#1c2736",
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <span>Word Mode</span>
                    <span style={{ fontSize: "14px", color: "#4d5d70", fontWeight: 400 }}>
                      Random words generated from the database word pool.
                    </span>
                  </div>

                  <div style={{ gridColumn: "2", gridRow: "1" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#5a6b80",
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
                        border: "1px solid #c5d3e4",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        backgroundColor: "#ffffff",
                        color: "#1c2736",
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
                          backgroundColor: wordNoMistakeMode === "on" ? "#2f9e44" : "#c5d3e4",
                          position: "relative",
                          transition: "background-color 120ms ease"
                        }}
                      >
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "999px",
                            backgroundColor: "#ffffff",
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
                        color: "#5a6b80",
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
                        border: "1px solid #c5d3e4",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        backgroundColor: "#ffffff",
                        color: "#1c2736",
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
                        color: "#5a6b80",
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
                        border: "1px solid #c5d3e4",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        backgroundColor: "#ffffff",
                        color: "#1c2736",
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
                    backgroundColor: "#1c2736",
                    color: "#ffffff",
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
                  : "(Sentences)"}
              </h1>
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
            <TypingGame
              mode={typingMode}
              wordsCount={wordsCount}
              wordDifficulty={wordDifficulty}
              wordNoMistakeMode={wordNoMistakeMode}
            />
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
              Your runs, personal bests, and accuracy history will show up here once tracking is added
              back.
            </p>
            <p style={{ marginBottom: 0, fontWeight: 600 }}>Database score saving is currently disabled.</p>
          </section>
        )}

        {activeTab === "account" && (
          <AccountPanel />
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
