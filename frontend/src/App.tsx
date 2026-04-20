import { useEffect, useMemo, useState } from "react";
import AccountPanel from "./account/AccountPanel";
import { useAuth } from "./auth/authContext";
import TypingGame from "./games/typing/components/TypingGame";
import { fetchTypingDailyActivity, fetchTypingStreakDays } from "./games/typing/services/runResults";
import type {
  SavedTypingDayStats,
  TypingFont,
  TypingLanguage,
  TypingMode,
  WordModeDifficulty,
  WordNoMistakeMode
} from "./games/typing/types";
import {
  getFontVariables,
  getLanguageLabel,
  getStoredFont,
  getStoredLanguage,
  getStoredTheme,
  getThemeVariables,
  isTypingLanguage,
  type ThemeMode
} from "./settings/preferences";
import SettingsPanel from "./settings/SettingsPanel";
import StatsPanel, { DailyActivityChart } from "./stats/StatsPanel";

type HeaderTab = "games" | "stats" | "account" | "settings";

const headerTabs: Array<{ id: HeaderTab; label: string }> = [
  { id: "games", label: "Games" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" }
];

function App() {
  const { configured, loading: authLoading, profile, settings, updateSettings, user } = useAuth();
  const [activeTab, setActiveTab] = useState<HeaderTab>("games");
  const [playingTypingGame, setPlayingTypingGame] = useState(false);
  const [typingMode, setTypingMode] = useState<TypingMode>("sentences");
  const [wordsCount, setWordsCount] = useState(25);
  const [wordDifficulty, setWordDifficulty] = useState<WordModeDifficulty>("mixed");
  const [wordNoMistakeMode, setWordNoMistakeMode] = useState<WordNoMistakeMode>("off");
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [font, setFont] = useState<TypingFont>(getStoredFont);
  const [localLanguage, setLocalLanguage] = useState<TypingLanguage>(getStoredLanguage);
  const [pendingAccountLanguage, setPendingAccountLanguage] = useState<TypingLanguage | null>(null);
  const [currentStreakDays, setCurrentStreakDays] = useState(0);
  const [dailyActivity, setDailyActivity] = useState<SavedTypingDayStats[]>([]);
  const accountLabel = authLoading ? "Account" : user ? profile?.username ?? "Account" : "Login";
  const themeVariables = useMemo(() => getThemeVariables(theme), [theme]);
  const fontVariables = useMemo(() => getFontVariables(font), [font]);
  const accountLanguage = isTypingLanguage(settings?.language) ? settings.language : null;
  const language = pendingAccountLanguage ?? (user ? accountLanguage : null) ?? localLanguage;
  const languageLabel = getLanguageLabel(language);
  const appStyle = useMemo(
    () => ({
      ...themeVariables,
      ...fontVariables,
      minHeight: "100vh",
      background: "var(--page-bg)",
      color: "var(--text)",
      fontFamily: "var(--app-font)"
    }),
    [fontVariables, themeVariables]
  );

  useEffect(() => {
    window.localStorage.setItem("rawtype-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("rawtype-language", language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem("rawtype-font", font);
  }, [font]);

  useEffect(() => {
    if (!configured || authLoading || !user) {
      return;
    }

    if (activeTab !== "games" || playingTypingGame) {
      return;
    }

    let active = true;

    void Promise.all([fetchTypingStreakDays(), fetchTypingDailyActivity()])
      .then(([streakDays, activityDays]) => {
        if (!active) return;
        setCurrentStreakDays(streakDays);
        setDailyActivity(activityDays);
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, [activeTab, authLoading, configured, playingTypingGame, user]);

  function handleLanguageChange(nextLanguage: TypingLanguage) {
    setLocalLanguage(nextLanguage);

    if (!user) {
      return;
    }

    setPendingAccountLanguage(nextLanguage);

    void updateSettings({ language: nextLanguage })
      .then(() => {
        setPendingAccountLanguage(null);
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }

  return (
    <div
      data-theme={theme}
      style={appStyle}
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                flexWrap: "wrap"
              }}
            >
              <h1 style={{ margin: 0, fontSize: "34px" }}>Start Menu</h1>
              {user && (
                <div
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    backgroundColor: "var(--surface)",
                    color: "var(--muted-strong)",
                    fontWeight: 700
                  }}
                >
                  Streak: {currentStreakDays} {currentStreakDays === 1 ? "day" : "days"}
                </div>
              )}
            </div>
             <div
              style={{
                marginTop: "22px",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "14px"
              }}
            >
              {user && (
                <section
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    backgroundColor: "var(--surface)",
                    padding: "18px",
                    display: "grid",
                    gap: "12px"
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "20px" }}>Daily Activity</h2>
                  <DailyActivityChart days={dailyActivity} />
                </section>
              )}

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
                  ? `(Words ${wordsCount}, ${wordDifficulty}, no-mistake ${wordNoMistakeMode}, ${languageLabel})`
                  : `(Prose, ${languageLabel})`}
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
              language={language}
            />
          </section>
        )}

        {activeTab === "stats" && <StatsPanel />}

        {activeTab === "account" && <AccountPanel />}

        {activeTab === "settings" && (
          <SettingsPanel
            darkMode={theme === "dark"}
            font={font}
            language={language}
            onDarkModeChange={(enabled) => setTheme(enabled ? "dark" : "light")}
            onFontChange={setFont}
            onLanguageChange={handleLanguageChange}
          />
        )}
      </main>
    </div>
  );
}

export default App;
