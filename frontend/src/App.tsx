// Coordinates the RawType app shell, tabs, and shared preferences.
// Passes account, language, and game settings into the active screen.
import { useEffect, useMemo, useState } from "react";
import AccountPanel from "./account/AccountPanel";
import AppHeader from "./app/AppHeader";
import HomeMenu from "./app/HomeMenu";
import type { AppTab } from "./app/types";
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
import { getStoredBoolean, getStoredHexColor, setStoredValue } from "./lib/localStorage";
import SettingsPanel from "./settings/SettingsPanel";
import StatsPanel from "./stats/StatsPanel";

function App() {
  const { configured, loading: authLoading, profile, settings, updateSettings, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>("games");
  const [playingTypingGame, setPlayingTypingGame] = useState(false);
  const [typingMode, setTypingMode] = useState<TypingMode>("sentences");
  const [wordsCount, setWordsCount] = useState(25);
  const [wordDifficulty, setWordDifficulty] = useState<WordModeDifficulty>("mixed");
  const [wordNoMistakeMode, setWordNoMistakeMode] = useState<WordNoMistakeMode>("off");
  const [highlightCorrectWords, setHighlightCorrectWords] = useState<boolean>(() =>
    getStoredBoolean("rawtype-highlight-correct-words", true)
  );
  const [highlightErrorFromPoint, setHighlightErrorFromPoint] = useState<boolean>(() =>
    getStoredBoolean("rawtype-highlight-error-from-point", true)
  );
  const [showOnScreenKeyboard, setShowOnScreenKeyboard] = useState<boolean>(() =>
    getStoredBoolean("rawtype-show-onscreen-keyboard", false)
  );
  const [correctMarkerColor, setCorrectMarkerColor] = useState<string>(() =>
    getStoredHexColor("rawtype-correct-marker-color", "#6fbf73")
  );
  const [errorMarkerColor, setErrorMarkerColor] = useState<string>(() =>
    getStoredHexColor("rawtype-error-marker-color", "#c86b73")
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
    setStoredValue("rawtype-theme", theme);
  }, [theme]);

  useEffect(() => {
    setStoredValue("rawtype-language", language);
    document.documentElement.lang = language === "de" ? "de" : "en";
  }, [language]);

  useEffect(() => {
    setStoredValue("rawtype-font", font);
  }, [font]);

  useEffect(() => {
    setStoredValue("rawtype-highlight-correct-words", highlightCorrectWords);
  }, [highlightCorrectWords]);

  useEffect(() => {
    setStoredValue("rawtype-highlight-error-from-point", highlightErrorFromPoint);
  }, [highlightErrorFromPoint]);

  useEffect(() => {
    setStoredValue("rawtype-show-onscreen-keyboard", showOnScreenKeyboard);
  }, [showOnScreenKeyboard]);

  useEffect(() => {
    setStoredValue("rawtype-correct-marker-color", correctMarkerColor);
  }, [correctMarkerColor]);

  useEffect(() => {
    setStoredValue("rawtype-error-marker-color", errorMarkerColor);
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

  function handleSelectTab(tab: AppTab) {
    setActiveTab(tab);
    setPlayingTypingGame(false);
  }

  return (
    <div
      data-theme={theme}
      style={appStyle}
    >
      <AppHeader
        activeTab={activeTab}
        accountLabel={accountLabel}
        appText={appText}
        onSelectTab={handleSelectTab}
      />

      <main style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 24px 40px" }}>
        {activeTab === "games" && !playingTypingGame && (
          <HomeMenu
            appText={appText}
            currentStreakDays={currentStreakDays}
            dailyActivity={dailyActivity}
            language={language}
            signedIn={Boolean(user)}
            wordDifficulty={wordDifficulty}
            wordNoMistakeMode={wordNoMistakeMode}
            wordsCount={wordsCount}
            onStartClassic={() => {
              setTypingMode("sentences");
              setPlayingTypingGame(true);
            }}
            onStartWordMode={() => {
              setTypingMode("words");
              setPlayingTypingGame(true);
            }}
            onWordDifficultyChange={setWordDifficulty}
            onWordNoMistakeModeChange={setWordNoMistakeMode}
            onWordsCountChange={setWordsCount}
          />
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
