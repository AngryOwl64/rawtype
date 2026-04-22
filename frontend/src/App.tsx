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
import { getAppTexts } from "./i18n/messages";
import SettingsPanel from "./settings/SettingsPanel";
import StatsPanel, { DailyActivityChart } from "./stats/StatsPanel";

type HeaderTab = "games" | "stats" | "account" | "settings";

function getStoredFlag(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const storedValue = window.localStorage.getItem(key);
  if (storedValue === null) return defaultValue;
  return storedValue === "true";
}

function getStoredColor(key: string, defaultValue: string): string {
  if (typeof window === "undefined") return defaultValue;
  const storedValue = window.localStorage.getItem(key);
  return storedValue && /^#[0-9a-fA-F]{6}$/.test(storedValue) ? storedValue : defaultValue;
}

function App() {
  const { configured, loading: authLoading, profile, settings, updateSettings, user } = useAuth();
  const [activeTab, setActiveTab] = useState<HeaderTab>("games");
  const [playingTypingGame, setPlayingTypingGame] = useState(false);
  const [typingMode, setTypingMode] = useState<TypingMode>("sentences");
  const [wordsCount, setWordsCount] = useState(25);
  const [wordDifficulty, setWordDifficulty] = useState<WordModeDifficulty>("mixed");
  const [wordNoMistakeMode, setWordNoMistakeMode] = useState<WordNoMistakeMode>("off");
  const [highlightCorrectWords, setHighlightCorrectWords] = useState<boolean>(() =>
    getStoredFlag("rawtype-highlight-correct-words", true)
  );
  const [highlightErrorFromPoint, setHighlightErrorFromPoint] = useState<boolean>(() =>
    getStoredFlag("rawtype-highlight-error-from-point", true)
  );
  const [showOnScreenKeyboard, setShowOnScreenKeyboard] = useState<boolean>(() =>
    getStoredFlag("rawtype-show-onscreen-keyboard", false)
  );
  const [correctMarkerColor, setCorrectMarkerColor] = useState<string>(() =>
    getStoredColor("rawtype-correct-marker-color", "#6fbf73")
  );
  const [errorMarkerColor, setErrorMarkerColor] = useState<string>(() =>
    getStoredColor("rawtype-error-marker-color", "#c86b73")
  );
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [font, setFont] = useState<TypingFont>(getStoredFont);
  const [localLanguage, setLocalLanguage] = useState<TypingLanguage>(getStoredLanguage);
  const [pendingAccountLanguage, setPendingAccountLanguage] = useState<TypingLanguage | null>(null);
  const [currentStreakDays, setCurrentStreakDays] = useState(0);
  const [dailyActivity, setDailyActivity] = useState<SavedTypingDayStats[]>([]);
  const themeVariables = useMemo(() => getThemeVariables(theme), [theme]);
  const fontVariables = useMemo(() => getFontVariables(font), [font]);
  const accountLanguage = isTypingLanguage(settings?.language) ? settings.language : null;
  const language = pendingAccountLanguage ?? (user ? accountLanguage : null) ?? localLanguage;
  const appText = useMemo(() => getAppTexts(language), [language]);
  const accountLabel = authLoading
    ? appText.account.loading
    : user
      ? profile?.username ?? appText.account.default
      : appText.account.login;
  const languageLabel = getLanguageLabel(language);
  const headerTabs: Array<{ id: HeaderTab; label: string }> = [
    { id: "games", label: appText.tabs.games },
    { id: "stats", label: appText.tabs.stats },
    { id: "settings", label: appText.tabs.settings }
  ];
  const wordDifficultyLabel =
    wordDifficulty === "easy"
      ? appText.home.easy
      : wordDifficulty === "medium"
        ? appText.home.medium
        : wordDifficulty === "hard"
          ? appText.home.hard
          : appText.home.mixed;
  const noMistakeModeLabel = wordNoMistakeMode === "on" ? appText.home.on : appText.home.off;
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
    window.localStorage.setItem("rawtype-highlight-correct-words", String(highlightCorrectWords));
  }, [highlightCorrectWords]);

  useEffect(() => {
    window.localStorage.setItem("rawtype-highlight-error-from-point", String(highlightErrorFromPoint));
  }, [highlightErrorFromPoint]);

  useEffect(() => {
    window.localStorage.setItem("rawtype-show-onscreen-keyboard", String(showOnScreenKeyboard));
  }, [showOnScreenKeyboard]);

  useEffect(() => {
    window.localStorage.setItem("rawtype-correct-marker-color", correctMarkerColor);
  }, [correctMarkerColor]);

  useEffect(() => {
    window.localStorage.setItem("rawtype-error-marker-color", errorMarkerColor);
  }, [errorMarkerColor]);

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
              <h1 style={{ margin: 0, fontSize: "34px" }}>{appText.home.title}</h1>
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
                  {appText.home.streak}: {currentStreakDays}{" "}
                  {currentStreakDays === 1 ? appText.home.day : appText.home.days}
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
                  <h2 style={{ margin: 0, fontSize: "20px" }}>{appText.home.dailyActivity}</h2>
                  <DailyActivityChart days={dailyActivity} language={language} />
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
                <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>{appText.home.classicTitle}</h2>
                <p style={{ marginTop: 0, marginBottom: "14px", color: "var(--muted)", lineHeight: 1.45 }}>
                  {appText.home.classicDescription}
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
                  {appText.home.startClassic}
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
                    <span>{appText.home.wordModeTitle}</span>
                    <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 400 }}>
                      {appText.home.wordModeDescription}
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
                      {appText.home.noMistakeMode}
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
                      <span>{wordNoMistakeMode === "on" ? appText.home.on : appText.home.off}</span>
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
                      {appText.home.words}
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
                      <option value={10}>10 {appText.home.wordsSuffix}</option>
                      <option value={25}>25 {appText.home.wordsSuffix}</option>
                      <option value={50}>50 {appText.home.wordsSuffix}</option>
                      <option value={75}>75 {appText.home.wordsSuffix}</option>
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
                      {appText.home.difficulty}
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
                      <option value="easy">{appText.home.easy}</option>
                      <option value="medium">{appText.home.medium}</option>
                      <option value="hard">{appText.home.hard}</option>
                      <option value="mixed">{appText.home.mixed}</option>
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
                  {appText.home.startWordMode}
                </button>
              </article>
            </div>
          </section>
        )}

        {activeTab === "games" && playingTypingGame && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1 style={{ margin: 0, fontSize: "30px" }}>
                {appText.gameHeader.title}{" "}
                {typingMode === "words"
                  ? `(${appText.gameHeader.wordsLabel} ${wordsCount}, ${wordDifficultyLabel}, ${appText.gameHeader.noMistakeLabel} ${noMistakeModeLabel}, ${languageLabel})`
                  : `(${appText.gameHeader.proseLabel}, ${languageLabel})`}
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
                {appText.gameHeader.backToMenu}
              </button>
            </div>
            <TypingGame
              mode={typingMode}
              wordsCount={wordsCount}
              wordDifficulty={wordDifficulty}
              wordNoMistakeMode={wordNoMistakeMode}
              language={language}
              highlightCorrectWords={highlightCorrectWords}
              highlightErrorFromPoint={highlightErrorFromPoint}
              showOnScreenKeyboard={showOnScreenKeyboard}
              correctMarkerColor={correctMarkerColor}
              errorMarkerColor={errorMarkerColor}
            />
          </section>
        )}

        {activeTab === "stats" && <StatsPanel language={language} />}

        {activeTab === "account" && <AccountPanel language={language} />}

        {activeTab === "settings" && (
          <SettingsPanel
            theme={theme}
            font={font}
            language={language}
            highlightCorrectWords={highlightCorrectWords}
            highlightErrorFromPoint={highlightErrorFromPoint}
            showOnScreenKeyboard={showOnScreenKeyboard}
            correctMarkerColor={correctMarkerColor}
            errorMarkerColor={errorMarkerColor}
            onThemeChange={setTheme}
            onFontChange={setFont}
            onLanguageChange={handleLanguageChange}
            onHighlightCorrectWordsChange={setHighlightCorrectWords}
            onHighlightErrorFromPointChange={setHighlightErrorFromPoint}
            onShowOnScreenKeyboardChange={setShowOnScreenKeyboard}
            onCorrectMarkerColorChange={setCorrectMarkerColor}
            onErrorMarkerColorChange={setErrorMarkerColor}
          />
        )}
      </main>
    </div>
  );
}

export default App;
