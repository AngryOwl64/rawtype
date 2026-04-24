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
  AppFont,
  OnScreenKeyboardLayout,
  RestartKey,
  SavedTypingDayStats,
  TextFont,
  TypingLanguage,
  TypingMode,
  WordModeDifficulty,
  WordNoMistakeMode
} from "./games/typing/types";
import {
  getFontVariables,
  getLanguageLabel,
  getStoredAppFont,
  getStoredOnScreenKeyboardLayout,
  getStoredRestartKey,
  getStoredLanguage,
  getStoredTextFont,
  getStoredTheme,
  getThemeVariables,
  isAppFont,
  isOnScreenKeyboardLayout,
  isRestartKey,
  isTextFont,
  isTypingLanguage,
  type ThemeMode
} from "./settings/preferences";
import { getAppTexts, getSettingsTexts, translateAccountText } from "./i18n/messages";
import { getStoredBoolean, getStoredHexColor, isHexColor, setStoredValue } from "./lib/localStorage";
import PublicProfilePanel from "./profile/PublicProfilePanel";
import SettingsPanel, { type SettingsCategory, type SettingsCategoryItem } from "./settings/SettingsPanel";
import StatsPanel from "./stats/StatsPanel";
import { resolveThemeId } from "./themes/registry";

type RouteState =
  | { kind: "games" | "stats" | "account" | "settings" }
  | { kind: "publicProfile"; username: string };

const routePathsByTab: Record<AppTab, string> = {
  games: "/",
  stats: "/stats",
  account: "/profile",
  settings: "/settings"
};

function isTypingMode(value: string | null | undefined): value is TypingMode {
  return value === "sentences" || value === "words";
}

function isWordsCount(value: number | null | undefined): value is 10 | 25 | 50 | 75 {
  return value === 10 || value === 25 || value === 50 || value === 75;
}

function isWordDifficulty(value: string | null | undefined): value is WordModeDifficulty {
  return value === "easy" || value === "medium" || value === "hard" || value === "mixed";
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function parseRoute(pathname: string): RouteState {
  const normalizedPath = normalizePathname(pathname);

  if (
    normalizedPath === "/" ||
    normalizedPath === "/de" ||
    normalizedPath === "/typing-test" ||
    normalizedPath === "/de/tipptraining"
  ) {
    return { kind: "games" };
  }

  if (normalizedPath === "/profile" || normalizedPath === "/account") {
    return { kind: "account" };
  }

  if (normalizedPath === "/settings") {
    return { kind: "settings" };
  }

  if (normalizedPath === "/stats") {
    return { kind: "stats" };
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments.length === 1) {
    return {
      kind: "publicProfile",
      username: decodeURIComponent(segments[0]).trim().toLowerCase()
    };
  }

  return { kind: "games" };
}

function getActiveTabFromRoute(route: RouteState): AppTab | null {
  if (route.kind === "publicProfile") {
    return null;
  }

  return route.kind;
}

function App() {
  const { configured, loading: authLoading, profile, settings, signOut, updateSettings, user } = useAuth();
  const [route, setRoute] = useState<RouteState>(() => parseRoute(window.location.pathname));
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
  const [onScreenKeyboardLayout, setOnScreenKeyboardLayout] = useState<OnScreenKeyboardLayout>(
    getStoredOnScreenKeyboardLayout
  );
  const [restartKey, setRestartKey] = useState<RestartKey>(getStoredRestartKey);
  const [saveRunsToAccount, setSaveRunsToAccount] = useState<boolean>(() =>
    getStoredBoolean("rawtype-save-runs-to-account", true)
  );
  const [saveErrorWords, setSaveErrorWords] = useState<boolean>(() =>
    getStoredBoolean("rawtype-save-error-words", true)
  );
  const [showErrorBreakdown, setShowErrorBreakdown] = useState<boolean>(() =>
    getStoredBoolean("rawtype-show-error-breakdown", true)
  );
  const [correctMarkerColor, setCorrectMarkerColor] = useState<string>(() =>
    getStoredHexColor("rawtype-correct-marker-color", "#6fbf73")
  );
  const [errorMarkerColor, setErrorMarkerColor] = useState<string>(() =>
    getStoredHexColor("rawtype-error-marker-color", "#c86b73")
  );
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [appFont, setAppFont] = useState<AppFont>(getStoredAppFont);
  const [textFont, setTextFont] = useState<TextFont>(getStoredTextFont);
  const [localLanguage, setLocalLanguage] = useState<TypingLanguage>(getStoredLanguage);
  const [pendingAccountLanguage, setPendingAccountLanguage] = useState<TypingLanguage | null>(null);
  const [activeSettingsCategory, setActiveSettingsCategory] = useState<SettingsCategory>("appearance");
  const [currentStreakDays, setCurrentStreakDays] = useState(0);
  const [dailyActivity, setDailyActivity] = useState<SavedTypingDayStats[]>([]);
  const themeVariables = useMemo(() => getThemeVariables(theme), [theme]);
  const fontVariables = useMemo(() => getFontVariables(appFont, textFont), [appFont, textFont]);
  const accountLanguage = isTypingLanguage(settings?.language) ? settings.language : null;
  const language = pendingAccountLanguage ?? (user ? accountLanguage : null) ?? localLanguage;
  const appText = useMemo(() => getAppTexts(language), [language]);
  const settingsCategoryItems = useMemo<SettingsCategoryItem[]>(() => {
    const settingsText = getSettingsTexts(language);
    const accountText = (en: string) => translateAccountText(language, en);

    return [
      { id: "appearance", label: settingsText.page.appearance },
      { id: "typing", label: settingsText.page.typing },
      { id: "markers", label: settingsText.page.wordMarking },
      { id: "keyboard", label: settingsText.page.keyboard },
      { id: "privacy", label: settingsText.page.privacyData },
      { id: "account", label: accountText("Account Settings") }
    ];
  }, [language]);
  const activeTab = useMemo(() => getActiveTabFromRoute(route), [route]);
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
    if (!user || !settings) {
      return;
    }

    setTheme(resolveThemeId(settings.theme));
    if (isAppFont(settings.app_font)) setAppFont(settings.app_font);
    if (isTextFont(settings.text_font)) setTextFont(settings.text_font);
    if (isTypingMode(settings.default_typing_mode)) setTypingMode(settings.default_typing_mode);
    if (isWordsCount(settings.default_words_count)) setWordsCount(settings.default_words_count);
    if (isWordDifficulty(settings.default_word_difficulty)) setWordDifficulty(settings.default_word_difficulty);
    if (typeof settings.default_no_mistake === "boolean") {
      setWordNoMistakeMode(settings.default_no_mistake ? "on" : "off");
    }
    if (typeof settings.highlight_correct_words === "boolean") {
      setHighlightCorrectWords(settings.highlight_correct_words);
    }
    if (typeof settings.highlight_error_from_point === "boolean") {
      setHighlightErrorFromPoint(settings.highlight_error_from_point);
    }
    if (typeof settings.show_on_screen_keyboard === "boolean") {
      setShowOnScreenKeyboard(settings.show_on_screen_keyboard);
    }
    if (isOnScreenKeyboardLayout(settings.on_screen_keyboard_layout)) {
      setOnScreenKeyboardLayout(settings.on_screen_keyboard_layout);
    }
    if (isRestartKey(settings.restart_key)) setRestartKey(settings.restart_key);
    if (isHexColor(settings.correct_marker_color)) setCorrectMarkerColor(settings.correct_marker_color);
    if (isHexColor(settings.error_marker_color)) setErrorMarkerColor(settings.error_marker_color);
    if (typeof settings.save_runs_to_account === "boolean") {
      setSaveRunsToAccount(settings.save_runs_to_account);
    }
    if (typeof settings.save_error_words === "boolean") {
      setSaveErrorWords(settings.save_error_words);
    }
    if (typeof settings.show_error_breakdown === "boolean") {
      setShowErrorBreakdown(settings.show_error_breakdown);
    }
  }, [settings, user]);

  function updateAccountSettings(updates: Parameters<typeof updateSettings>[0]) {
    if (!user) {
      return;
    }

    void updateSettings(updates).catch((error: unknown) => {
      console.error(error);
    });
  }

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    updateAccountSettings({ theme: nextTheme });
  }

  function handleAppFontChange(nextFont: AppFont) {
    setAppFont(nextFont);
    updateAccountSettings({ app_font: nextFont });
  }

  function handleTextFontChange(nextFont: TextFont) {
    setTextFont(nextFont);
    updateAccountSettings({ text_font: nextFont });
  }

  function handleDefaultTypingModeChange(nextMode: TypingMode) {
    setTypingMode(nextMode);
    updateAccountSettings({ default_typing_mode: nextMode });
  }

  function handleDefaultWordsCountChange(nextWordsCount: number) {
    setWordsCount(nextWordsCount);
    updateAccountSettings({ default_words_count: nextWordsCount });
  }

  function handleDefaultWordDifficultyChange(nextDifficulty: WordModeDifficulty) {
    setWordDifficulty(nextDifficulty);
    updateAccountSettings({ default_word_difficulty: nextDifficulty });
  }

  function handleDefaultNoMistakeModeChange(nextMode: WordNoMistakeMode) {
    setWordNoMistakeMode(nextMode);
    updateAccountSettings({ default_no_mistake: nextMode === "on" });
  }

  function handleHighlightCorrectWordsChange(enabled: boolean) {
    setHighlightCorrectWords(enabled);
    updateAccountSettings({ highlight_correct_words: enabled });
  }

  function handleHighlightErrorFromPointChange(enabled: boolean) {
    setHighlightErrorFromPoint(enabled);
    updateAccountSettings({ highlight_error_from_point: enabled });
  }

  function handleShowOnScreenKeyboardChange(enabled: boolean) {
    setShowOnScreenKeyboard(enabled);
    updateAccountSettings({ show_on_screen_keyboard: enabled });
  }

  function handleOnScreenKeyboardLayoutChange(nextLayout: OnScreenKeyboardLayout) {
    setOnScreenKeyboardLayout(nextLayout);
    updateAccountSettings({ on_screen_keyboard_layout: nextLayout });
  }

  function handleRestartKeyChange(nextKey: RestartKey) {
    setRestartKey(nextKey);
    updateAccountSettings({ restart_key: nextKey });
  }

  function handleCorrectMarkerColorChange(nextColor: string) {
    setCorrectMarkerColor(nextColor);
    updateAccountSettings({ correct_marker_color: nextColor });
  }

  function handleErrorMarkerColorChange(nextColor: string) {
    setErrorMarkerColor(nextColor);
    updateAccountSettings({ error_marker_color: nextColor });
  }

  function handleSaveRunsToAccountChange(enabled: boolean) {
    setSaveRunsToAccount(enabled);
    updateAccountSettings({ save_runs_to_account: enabled });
  }

  function handleSaveErrorWordsChange(enabled: boolean) {
    setSaveErrorWords(enabled);
    updateAccountSettings({ save_error_words: enabled });
  }

  function handleShowErrorBreakdownChange(enabled: boolean) {
    setShowErrorBreakdown(enabled);
    updateAccountSettings({ show_error_breakdown: enabled });
  }

  useEffect(() => {
    setStoredValue("rawtype-theme", theme);
  }, [theme]);

  useEffect(() => {
    setStoredValue("rawtype-language", language);
    document.documentElement.lang = language === "de" ? "de" : "en";
  }, [language]);

  useEffect(() => {
    setStoredValue("rawtype-app-font", appFont);
  }, [appFont]);

  useEffect(() => {
    setStoredValue("rawtype-text-font", textFont);
  }, [textFont]);

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
    setStoredValue("rawtype-onscreen-keyboard-layout", onScreenKeyboardLayout);
  }, [onScreenKeyboardLayout]);

  useEffect(() => {
    setStoredValue("rawtype-restart-key", restartKey);
  }, [restartKey]);

  useEffect(() => {
    setStoredValue("rawtype-save-runs-to-account", saveRunsToAccount);
  }, [saveRunsToAccount]);

  useEffect(() => {
    setStoredValue("rawtype-save-error-words", saveErrorWords);
  }, [saveErrorWords]);

  useEffect(() => {
    setStoredValue("rawtype-show-error-breakdown", showErrorBreakdown);
  }, [showErrorBreakdown]);

  useEffect(() => {
    setStoredValue("rawtype-correct-marker-color", correctMarkerColor);
  }, [correctMarkerColor]);

  useEffect(() => {
    setStoredValue("rawtype-error-marker-color", errorMarkerColor);
  }, [errorMarkerColor]);

  useEffect(() => {
    function handlePopState() {
      setRoute(parseRoute(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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

  function navigateToPath(pathname: string) {
    const nextPath = normalizePathname(pathname);
    const currentPath = normalizePathname(window.location.pathname);

    if (nextPath !== currentPath) {
      window.history.pushState(null, "", nextPath);
    }

    setRoute(parseRoute(nextPath));
  }

  function handleSelectTab(tab: AppTab) {
    setPlayingTypingGame(false);
    navigateToPath(routePathsByTab[tab]);
  }

  function handleSelectSettingsCategory(category: SettingsCategory) {
    setActiveSettingsCategory(category);
    handleSelectTab("settings");
  }

  function handleLogout() {
    void signOut()
      .then(() => {
        handleSelectTab("games");
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
      <AppHeader
        activeTab={activeTab}
        accountLabel={accountLabel}
        appText={appText}
        language={language}
        settingsCategories={settingsCategoryItems}
        signedIn={Boolean(user)}
        onSelectTab={handleSelectTab}
        onSelectSettingsCategory={handleSelectSettingsCategory}
        onLogout={handleLogout}
      />

      <main style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 24px 40px" }}>
        {route.kind === "games" && !playingTypingGame && (
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
              updateAccountSettings({ default_typing_mode: "sentences" });
              setPlayingTypingGame(true);
            }}
            onStartWordMode={() => {
              setTypingMode("words");
              updateAccountSettings({ default_typing_mode: "words" });
              setPlayingTypingGame(true);
            }}
            onWordDifficultyChange={handleDefaultWordDifficultyChange}
            onWordNoMistakeModeChange={handleDefaultNoMistakeModeChange}
            onWordsCountChange={handleDefaultWordsCountChange}
          />
        )}

        {route.kind === "games" && playingTypingGame && (
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
              onScreenKeyboardLayout={onScreenKeyboardLayout}
              restartKey={restartKey}
              saveRunsToAccount={saveRunsToAccount}
              saveErrorWords={saveErrorWords}
              showErrorBreakdown={showErrorBreakdown}
              correctMarkerColor={correctMarkerColor}
              errorMarkerColor={errorMarkerColor}
            />
          </section>
        )}

        {route.kind === "stats" && <StatsPanel language={language} />}

        {route.kind === "account" && <AccountPanel language={language} />}

        {route.kind === "settings" && (
          <SettingsPanel
            activeCategory={activeSettingsCategory}
            theme={theme}
            appFont={appFont}
            textFont={textFont}
            language={language}
            highlightCorrectWords={highlightCorrectWords}
            highlightErrorFromPoint={highlightErrorFromPoint}
            showOnScreenKeyboard={showOnScreenKeyboard}
            onScreenKeyboardLayout={onScreenKeyboardLayout}
            restartKey={restartKey}
            saveRunsToAccount={saveRunsToAccount}
            saveErrorWords={saveErrorWords}
            showErrorBreakdown={showErrorBreakdown}
            correctMarkerColor={correctMarkerColor}
            errorMarkerColor={errorMarkerColor}
            defaultTypingMode={typingMode}
            defaultWordsCount={wordsCount}
            defaultWordDifficulty={wordDifficulty}
            defaultNoMistakeMode={wordNoMistakeMode}
            onThemeChange={handleThemeChange}
            onAppFontChange={handleAppFontChange}
            onTextFontChange={handleTextFontChange}
            onLanguageChange={handleLanguageChange}
            onDefaultTypingModeChange={handleDefaultTypingModeChange}
            onDefaultWordsCountChange={handleDefaultWordsCountChange}
            onDefaultWordDifficultyChange={handleDefaultWordDifficultyChange}
            onDefaultNoMistakeModeChange={handleDefaultNoMistakeModeChange}
            onHighlightCorrectWordsChange={handleHighlightCorrectWordsChange}
            onHighlightErrorFromPointChange={handleHighlightErrorFromPointChange}
            onShowOnScreenKeyboardChange={handleShowOnScreenKeyboardChange}
            onOnScreenKeyboardLayoutChange={handleOnScreenKeyboardLayoutChange}
            onRestartKeyChange={handleRestartKeyChange}
            onSaveRunsToAccountChange={handleSaveRunsToAccountChange}
            onSaveErrorWordsChange={handleSaveErrorWordsChange}
            onShowErrorBreakdownChange={handleShowErrorBreakdownChange}
            onCorrectMarkerColorChange={handleCorrectMarkerColorChange}
            onErrorMarkerColorChange={handleErrorMarkerColorChange}
            onCategoryChange={setActiveSettingsCategory}
          />
        )}

        {route.kind === "publicProfile" && (
          <PublicProfilePanel username={route.username} language={language} />
        )}
      </main>
    </div>
  );
}

export default App;
