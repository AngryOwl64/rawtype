// Coordinates the RawType app shell, tabs, and shared preferences.
// Passes account, language, and game settings into the active screen.
import { lazy, Suspense, useEffect, useMemo, useReducer, useState } from "react";
import AppHeader from "./app/AppHeader";
import HomeMenu from "./app/HomeMenu";
import type { AppTab } from "./app/types";
import { useAuth, type UserSettings } from "./auth/authContext";
import type {
  AnimationIntensity,
  AppFont,
  CustomFont,
  CaretAnimationStyle,
  CaretMovementAnimation,
  CompletionAnimationStyle,
  ErrorFeedbackAnimation,
  KeyboardAnimationStyle,
  OnScreenKeyboardLayout,
  RestartKey,
  SavedTypingDayStats,
  TextFont,
  TypingFeedbackAnimation,
  TypingLanguage,
  TypingMode,
  WordModeDifficulty,
  WordNoMistakeMode
} from "./games/typing/types";
import {
  getAnimationVariables,
  getFontVariables,
  getLanguageLabel,
  getStoredAnimationIntensity,
  getStoredAppFont,
  getStoredCaretAnimationStyle,
  getStoredCaretMovementAnimation,
  getStoredCompletionAnimationStyle,
  getStoredErrorFeedbackAnimation,
  getStoredKeyboardAnimationStyle,
  getStoredGameLanguage,
  getStoredOnScreenKeyboardLayout,
  getStoredRestartKey,
  getStoredLanguage,
  getStoredTextFont,
  getStoredTheme,
  getStoredTypingFeedbackAnimation,
  getThemeVariables,
  isAnimationIntensity,
  isAppFont,
  isCaretAnimationStyle,
  isCaretMovementAnimation,
  isCompletionAnimationStyle,
  isErrorFeedbackAnimation,
  isKeyboardAnimationStyle,
  isOnScreenKeyboardLayout,
  isRestartKey,
  isTextFont,
  isTypingFeedbackAnimation,
  isTypingLanguage,
  type ThemeMode
} from "./settings/preferences";
import { getAppTexts, getSettingsTexts, translateAccountText } from "./i18n/messages";
import { getStoredBoolean, getStoredHexColor, isHexColor, setStoredValue } from "./lib/localStorage";
import { deleteCustomFont, fetchCustomFonts, importGoogleFont } from "./settings/customFonts";
import type { SettingsCategory, SettingsCategoryItem } from "./settings/SettingsPanel";
import { DEFAULT_THEME_ID, resolveThemeId } from "./themes/registry";

const AccountPanel = lazy(() => import("./account/AccountPanel"));
const PublicProfilePanel = lazy(() => import("./profile/PublicProfilePanel"));
const SettingsPanel = lazy(() => import("./settings/SettingsPanel"));
const StatsPanel = lazy(() => import("./stats/StatsPanel"));
const TypingGame = lazy(() => import("./games/typing/components/TypingGame"));

const EMPTY_CUSTOM_FONTS: CustomFont[] = [];

type RouteState =
  | { kind: "games" | "stats" | "account" | "settings" }
  | { kind: "publicProfile"; username: string };

const routePathsByTab: Record<AppTab, string> = {
  games: "/",
  stats: "/stats",
  account: "/profile",
  settings: "/settings"
};

const seoGamePaths = new Set([
  "/",
  "/de",
  "/typing-test",
  "/typing-practice",
  "/wpm-test",
  "/word-mode",
  "/no-mistake-mode",
  "/de/tipptraining",
  "/de/tipptrainer",
  "/de/tippgeschwindigkeit-test",
  "/de/wortmodus",
  "/de/no-mistake-modus"
]);

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

  if (seoGamePaths.has(normalizedPath)) {
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

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !("matchMedia" in window)) {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

type PreferencesState = {
  typingMode: TypingMode;
  gameLanguage: TypingLanguage;
  wordsCount: number;
  wordDifficulty: WordModeDifficulty;
  wordNoMistakeMode: WordNoMistakeMode;
  highlightCorrectWords: boolean;
  highlightErrorFromPoint: boolean;
  showOnScreenKeyboard: boolean;
  onScreenKeyboardLayout: OnScreenKeyboardLayout;
  restartKey: RestartKey;
  saveRunsToAccount: boolean;
  saveErrorWords: boolean;
  showErrorBreakdown: boolean;
  correctMarkerColor: string;
  errorMarkerColor: string;
  theme: ThemeMode;
  appFont: AppFont;
  textFont: TextFont;
  animationIntensity: AnimationIntensity;
  caretAnimationStyle: CaretAnimationStyle;
  caretMovementAnimation: CaretMovementAnimation;
  typingFeedbackAnimation: TypingFeedbackAnimation;
  errorFeedbackAnimation: ErrorFeedbackAnimation;
  keyboardAnimationStyle: KeyboardAnimationStyle;
  completionAnimationStyle: CompletionAnimationStyle;
  animationRespectReducedMotion: boolean;
};

type PreferencesAction =
  | { type: "patch"; updates: Partial<PreferencesState> }
  | { type: "applyAccountSettings"; settings: UserSettings };

function getInitialPreferences(): PreferencesState {
  return {
    typingMode: "sentences",
    gameLanguage: getStoredGameLanguage(),
    wordsCount: 25,
    wordDifficulty: "mixed",
    wordNoMistakeMode: "off",
    highlightCorrectWords: getStoredBoolean("rawtype-highlight-correct-words", true),
    highlightErrorFromPoint: getStoredBoolean("rawtype-highlight-error-from-point", true),
    showOnScreenKeyboard: getStoredBoolean("rawtype-show-onscreen-keyboard", false),
    onScreenKeyboardLayout: getStoredOnScreenKeyboardLayout(),
    restartKey: getStoredRestartKey(),
    saveRunsToAccount: getStoredBoolean("rawtype-save-runs-to-account", true),
    saveErrorWords: getStoredBoolean("rawtype-save-error-words", true),
    showErrorBreakdown: getStoredBoolean("rawtype-show-error-breakdown", true),
    correctMarkerColor: getStoredHexColor("rawtype-correct-marker-color", "#6fbf73"),
    errorMarkerColor: getStoredHexColor("rawtype-error-marker-color", "#c86b73"),
    theme: getStoredTheme(),
    appFont: getStoredAppFont(),
    textFont: getStoredTextFont(),
    animationIntensity: getStoredAnimationIntensity(),
    caretAnimationStyle: getStoredCaretAnimationStyle(),
    caretMovementAnimation: getStoredCaretMovementAnimation(),
    typingFeedbackAnimation: getStoredTypingFeedbackAnimation(),
    errorFeedbackAnimation: getStoredErrorFeedbackAnimation(),
    keyboardAnimationStyle: getStoredKeyboardAnimationStyle(),
    completionAnimationStyle: getStoredCompletionAnimationStyle(),
    animationRespectReducedMotion: getStoredBoolean("rawtype-animation-respect-reduced-motion", true)
  };
}

function preferencesReducer(state: PreferencesState, action: PreferencesAction): PreferencesState {
  if (action.type === "patch") {
    return { ...state, ...action.updates };
  }

  const { settings } = action;
  return {
    ...state,
    theme: resolveThemeId(settings.theme) ?? DEFAULT_THEME_ID,
    appFont: isAppFont(settings.app_font) ? settings.app_font : state.appFont,
    textFont: isTextFont(settings.text_font) ? settings.text_font : state.textFont,
    typingMode: isTypingMode(settings.default_typing_mode) ? settings.default_typing_mode : state.typingMode,
    wordsCount: isWordsCount(settings.default_words_count) ? settings.default_words_count : state.wordsCount,
    wordDifficulty: isWordDifficulty(settings.default_word_difficulty)
      ? settings.default_word_difficulty
      : state.wordDifficulty,
    wordNoMistakeMode: settings.default_no_mistake ? "on" : "off",
    highlightCorrectWords:
      typeof settings.highlight_correct_words === "boolean"
        ? settings.highlight_correct_words
        : state.highlightCorrectWords,
    highlightErrorFromPoint:
      typeof settings.highlight_error_from_point === "boolean"
        ? settings.highlight_error_from_point
        : state.highlightErrorFromPoint,
    showOnScreenKeyboard:
      typeof settings.show_on_screen_keyboard === "boolean"
        ? settings.show_on_screen_keyboard
        : state.showOnScreenKeyboard,
    onScreenKeyboardLayout: isOnScreenKeyboardLayout(settings.on_screen_keyboard_layout)
      ? settings.on_screen_keyboard_layout
      : state.onScreenKeyboardLayout,
    restartKey: isRestartKey(settings.restart_key) ? settings.restart_key : state.restartKey,
    correctMarkerColor: isHexColor(settings.correct_marker_color)
      ? settings.correct_marker_color
      : state.correctMarkerColor,
    errorMarkerColor: isHexColor(settings.error_marker_color) ? settings.error_marker_color : state.errorMarkerColor,
    saveRunsToAccount:
      typeof settings.save_runs_to_account === "boolean" ? settings.save_runs_to_account : state.saveRunsToAccount,
    saveErrorWords: typeof settings.save_error_words === "boolean" ? settings.save_error_words : state.saveErrorWords,
    showErrorBreakdown:
      typeof settings.show_error_breakdown === "boolean" ? settings.show_error_breakdown : state.showErrorBreakdown,
    animationIntensity: isAnimationIntensity(settings.animation_intensity)
      ? settings.animation_intensity
      : state.animationIntensity,
    caretAnimationStyle: isCaretAnimationStyle(settings.caret_animation)
      ? settings.caret_animation
      : state.caretAnimationStyle,
    caretMovementAnimation: isCaretMovementAnimation(settings.caret_movement_animation)
      ? settings.caret_movement_animation
      : state.caretMovementAnimation,
    typingFeedbackAnimation: isTypingFeedbackAnimation(settings.typing_feedback_animation)
      ? settings.typing_feedback_animation
      : state.typingFeedbackAnimation,
    errorFeedbackAnimation: isErrorFeedbackAnimation(settings.error_feedback_animation)
      ? settings.error_feedback_animation
      : state.errorFeedbackAnimation,
    keyboardAnimationStyle: isKeyboardAnimationStyle(settings.keyboard_animation)
      ? settings.keyboard_animation
      : state.keyboardAnimationStyle,
    completionAnimationStyle: isCompletionAnimationStyle(settings.completion_animation)
      ? settings.completion_animation
      : state.completionAnimationStyle,
    animationRespectReducedMotion:
      typeof settings.animation_respect_reduced_motion === "boolean"
        ? settings.animation_respect_reduced_motion
        : state.animationRespectReducedMotion
  };
}

function App() {
  const { configured, loading: authLoading, profile, settings, signOut, updateSettings, user } = useAuth();
  const [route, setRoute] = useState<RouteState>(() => parseRoute(window.location.pathname));
  const [playingTypingGame, setPlayingTypingGame] = useState(false);
  const [preferences, dispatchPreferences] = useReducer(preferencesReducer, undefined, getInitialPreferences);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [fontImporting, setFontImporting] = useState(false);
  const [fontImportError, setFontImportError] = useState("");
  const [localLanguage, setLocalLanguage] = useState<TypingLanguage>(getStoredLanguage);
  const [pendingAccountLanguage, setPendingAccountLanguage] = useState<TypingLanguage | null>(null);
  const [activeSettingsCategory, setActiveSettingsCategory] = useState<SettingsCategory>("appearance");
  const [currentStreakDays, setCurrentStreakDays] = useState(0);
  const [dailyActivity, setDailyActivity] = useState<SavedTypingDayStats[]>([]);
  const {
    animationIntensity,
    animationRespectReducedMotion,
    appFont,
    caretAnimationStyle,
    caretMovementAnimation,
    completionAnimationStyle,
    correctMarkerColor,
    errorMarkerColor,
    errorFeedbackAnimation,
    highlightCorrectWords,
    highlightErrorFromPoint,
    keyboardAnimationStyle,
    onScreenKeyboardLayout,
    restartKey,
    saveErrorWords,
    saveRunsToAccount,
    showErrorBreakdown,
    showOnScreenKeyboard,
    textFont,
    theme,
    gameLanguage,
    typingFeedbackAnimation,
    typingMode,
    wordDifficulty,
    wordNoMistakeMode,
    wordsCount
  } = preferences;
  const visibleCustomFonts = user ? customFonts : EMPTY_CUSTOM_FONTS;
  const themeVariables = useMemo(() => getThemeVariables(theme), [theme]);
  const fontVariables = useMemo(
    () => getFontVariables(appFont, textFont, visibleCustomFonts),
    [appFont, textFont, visibleCustomFonts]
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const effectiveAnimationIntensity =
    animationRespectReducedMotion && prefersReducedMotion ? "off" : animationIntensity;
  const animationVariables = useMemo(
    () => getAnimationVariables(effectiveAnimationIntensity),
    [effectiveAnimationIntensity]
  );
  const accountLanguage = isTypingLanguage(settings?.language) ? settings.language : null;
  const language = pendingAccountLanguage ?? (user ? accountLanguage : null) ?? localLanguage;
  const appText = useMemo(() => getAppTexts(language), [language]);
  const settingsCategoryItems = useMemo<SettingsCategoryItem[]>(() => {
    const settingsText = getSettingsTexts(language);
    const accountText = (en: string) => translateAccountText(language, en);

    return [
      { id: "appearance", label: settingsText.page.appearance },
      { id: "typing", label: settingsText.page.typing },
      { id: "animations", label: settingsText.page.animations },
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
  const gameLanguageLabel = getLanguageLabel(gameLanguage);
  const wordDifficultyLabel =
    wordDifficulty === "easy"
      ? appText.home.easy
      : wordDifficulty === "medium"
        ? appText.home.medium
        : wordDifficulty === "hard"
          ? appText.home.hard
          : appText.home.mixed;
  const gameTitle = typingMode === "words" ? appText.home.wordModeTitle : appText.gameHeader.title;
  const gameMeta =
    typingMode === "words"
      ? [
          `${wordsCount} ${appText.home.wordsSuffix}`,
          wordDifficultyLabel,
          ...(wordNoMistakeMode === "on" ? [appText.home.noMistakeMode] : []),
          gameLanguageLabel
        ]
      : [appText.gameHeader.proseLabel, gameLanguageLabel];
  const appStyle = useMemo(
    () => ({
      ...themeVariables,
      ...fontVariables,
      ...animationVariables,
      minHeight: "100vh",
      background: "var(--page-bg)",
      color: "var(--text)",
      fontFamily: "var(--app-font)"
    }),
    [animationVariables, fontVariables, themeVariables]
  );

  useEffect(() => {
    if (!user || !settings) {
      return;
    }

    dispatchPreferences({ type: "applyAccountSettings", settings });
  }, [settings, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setFontImportError("");
        return fetchCustomFonts();
      })
      .then((fonts) => {
        if (active && fonts) setCustomFonts(fonts);
      })
      .catch((error: unknown) => {
        if (active) setFontImportError(error instanceof Error ? error.message : "Could not load custom fonts.");
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const loadedLinks: HTMLLinkElement[] = [];

    for (const font of visibleCustomFonts) {
      const existingLink = document.querySelector<HTMLLinkElement>(`link[data-rawtype-font="${font.id}"]`);
      if (existingLink) {
        continue;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = font.cssUrl;
      link.dataset.rawtypeFont = font.id;
      document.head.appendChild(link);
      loadedLinks.push(link);
    }

    return () => {
      for (const link of loadedLinks) {
        link.remove();
      }
    };
  }, [visibleCustomFonts]);

  function updateAccountSettings(updates: Parameters<typeof updateSettings>[0]) {
    if (!user) {
      return;
    }

    void updateSettings(updates).catch((error: unknown) => {
      console.error(error);
    });
  }

  function handleThemeChange(nextTheme: ThemeMode) {
    dispatchPreferences({ type: "patch", updates: { theme: nextTheme } });
    updateAccountSettings({ theme: nextTheme });
  }

  function handleAppFontChange(nextFont: AppFont) {
    dispatchPreferences({ type: "patch", updates: { appFont: nextFont } });
    updateAccountSettings({ app_font: nextFont });
  }

  function handleTextFontChange(nextFont: TextFont) {
    dispatchPreferences({ type: "patch", updates: { textFont: nextFont } });
    updateAccountSettings({ text_font: nextFont });
  }

  async function handleImportFont(url: string) {
    setFontImporting(true);
    setFontImportError("");

    try {
      const importedFont = await importGoogleFont(url);
      setCustomFonts((fonts) => [importedFont, ...fonts.filter((font) => font.id !== importedFont.id)]);
      dispatchPreferences({ type: "patch", updates: { textFont: importedFont.selection } });
      updateAccountSettings({ text_font: importedFont.selection });
    } catch (error) {
      setFontImportError(error instanceof Error ? error.message : "Could not import font.");
    } finally {
      setFontImporting(false);
    }
  }

  function handleDeleteFont(font: CustomFont) {
    void deleteCustomFont(font.id)
      .then(() => {
        setCustomFonts((fonts) => fonts.filter((item) => item.id !== font.id));

        if (appFont === font.selection) {
          handleAppFontChange("system-sans");
        }

        if (textFont === font.selection) {
          handleTextFontChange("system-mono");
        }
      })
      .catch((error: unknown) => {
        setFontImportError(error instanceof Error ? error.message : "Could not delete font.");
      });
  }

  function handleDefaultTypingModeChange(nextMode: TypingMode) {
    dispatchPreferences({ type: "patch", updates: { typingMode: nextMode } });
    updateAccountSettings({ default_typing_mode: nextMode });
  }

  function handleDefaultWordsCountChange(nextWordsCount: number) {
    dispatchPreferences({ type: "patch", updates: { wordsCount: nextWordsCount } });
    updateAccountSettings({ default_words_count: nextWordsCount });
  }

  function handleDefaultWordDifficultyChange(nextDifficulty: WordModeDifficulty) {
    dispatchPreferences({ type: "patch", updates: { wordDifficulty: nextDifficulty } });
    updateAccountSettings({ default_word_difficulty: nextDifficulty });
  }

  function handleDefaultNoMistakeModeChange(nextMode: WordNoMistakeMode) {
    dispatchPreferences({ type: "patch", updates: { wordNoMistakeMode: nextMode } });
    updateAccountSettings({ default_no_mistake: nextMode === "on" });
  }

  function handleGameLanguageChange(nextLanguage: TypingLanguage) {
    dispatchPreferences({ type: "patch", updates: { gameLanguage: nextLanguage } });
  }

  function handleHighlightCorrectWordsChange(enabled: boolean) {
    dispatchPreferences({ type: "patch", updates: { highlightCorrectWords: enabled } });
    updateAccountSettings({ highlight_correct_words: enabled });
  }

  function handleHighlightErrorFromPointChange(enabled: boolean) {
    dispatchPreferences({ type: "patch", updates: { highlightErrorFromPoint: enabled } });
    updateAccountSettings({ highlight_error_from_point: enabled });
  }

  function handleShowOnScreenKeyboardChange(enabled: boolean) {
    dispatchPreferences({ type: "patch", updates: { showOnScreenKeyboard: enabled } });
    updateAccountSettings({ show_on_screen_keyboard: enabled });
  }

  function handleOnScreenKeyboardLayoutChange(nextLayout: OnScreenKeyboardLayout) {
    dispatchPreferences({ type: "patch", updates: { onScreenKeyboardLayout: nextLayout } });
    updateAccountSettings({ on_screen_keyboard_layout: nextLayout });
  }

  function handleRestartKeyChange(nextKey: RestartKey) {
    dispatchPreferences({ type: "patch", updates: { restartKey: nextKey } });
    updateAccountSettings({ restart_key: nextKey });
  }

  function handleCorrectMarkerColorChange(nextColor: string) {
    dispatchPreferences({ type: "patch", updates: { correctMarkerColor: nextColor } });
    updateAccountSettings({ correct_marker_color: nextColor });
  }

  function handleErrorMarkerColorChange(nextColor: string) {
    dispatchPreferences({ type: "patch", updates: { errorMarkerColor: nextColor } });
    updateAccountSettings({ error_marker_color: nextColor });
  }

  function handleAnimationIntensityChange(nextIntensity: AnimationIntensity) {
    dispatchPreferences({ type: "patch", updates: { animationIntensity: nextIntensity } });
    updateAccountSettings({ animation_intensity: nextIntensity });
  }

  function handleCaretAnimationStyleChange(nextStyle: CaretAnimationStyle) {
    dispatchPreferences({ type: "patch", updates: { caretAnimationStyle: nextStyle } });
    updateAccountSettings({ caret_animation: nextStyle });
  }

  function handleCaretMovementAnimationChange(nextAnimation: CaretMovementAnimation) {
    dispatchPreferences({ type: "patch", updates: { caretMovementAnimation: nextAnimation } });
    updateAccountSettings({ caret_movement_animation: nextAnimation });
  }

  function handleTypingFeedbackAnimationChange(nextAnimation: TypingFeedbackAnimation) {
    dispatchPreferences({ type: "patch", updates: { typingFeedbackAnimation: nextAnimation } });
    updateAccountSettings({ typing_feedback_animation: nextAnimation });
  }

  function handleErrorFeedbackAnimationChange(nextAnimation: ErrorFeedbackAnimation) {
    dispatchPreferences({ type: "patch", updates: { errorFeedbackAnimation: nextAnimation } });
    updateAccountSettings({ error_feedback_animation: nextAnimation });
  }

  function handleKeyboardAnimationStyleChange(nextStyle: KeyboardAnimationStyle) {
    dispatchPreferences({ type: "patch", updates: { keyboardAnimationStyle: nextStyle } });
    updateAccountSettings({ keyboard_animation: nextStyle });
  }

  function handleCompletionAnimationStyleChange(nextStyle: CompletionAnimationStyle) {
    dispatchPreferences({ type: "patch", updates: { completionAnimationStyle: nextStyle } });
    updateAccountSettings({ completion_animation: nextStyle });
  }

  function handleAnimationRespectReducedMotionChange(enabled: boolean) {
    dispatchPreferences({ type: "patch", updates: { animationRespectReducedMotion: enabled } });
    updateAccountSettings({ animation_respect_reduced_motion: enabled });
  }

  function handleSaveRunsToAccountChange(enabled: boolean) {
    dispatchPreferences({ type: "patch", updates: { saveRunsToAccount: enabled } });
    updateAccountSettings({ save_runs_to_account: enabled });
  }

  function handleSaveErrorWordsChange(enabled: boolean) {
    dispatchPreferences({ type: "patch", updates: { saveErrorWords: enabled } });
    updateAccountSettings({ save_error_words: enabled });
  }

  function handleShowErrorBreakdownChange(enabled: boolean) {
    dispatchPreferences({ type: "patch", updates: { showErrorBreakdown: enabled } });
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
    setStoredValue("rawtype-game-language", gameLanguage);
  }, [gameLanguage]);

  useEffect(() => {
    setStoredValue("rawtype-app-font", appFont);
  }, [appFont]);

  useEffect(() => {
    setStoredValue("rawtype-text-font", textFont);
  }, [textFont]);

  useEffect(() => {
    setStoredValue("rawtype-animation-intensity", animationIntensity);
  }, [animationIntensity]);

  useEffect(() => {
    setStoredValue("rawtype-caret-animation", caretAnimationStyle);
  }, [caretAnimationStyle]);

  useEffect(() => {
    setStoredValue("rawtype-caret-movement-animation", caretMovementAnimation);
  }, [caretMovementAnimation]);

  useEffect(() => {
    setStoredValue("rawtype-typing-feedback-animation", typingFeedbackAnimation);
  }, [typingFeedbackAnimation]);

  useEffect(() => {
    setStoredValue("rawtype-error-feedback-animation", errorFeedbackAnimation);
  }, [errorFeedbackAnimation]);

  useEffect(() => {
    setStoredValue("rawtype-keyboard-animation", keyboardAnimationStyle);
  }, [keyboardAnimationStyle]);

  useEffect(() => {
    setStoredValue("rawtype-completion-animation", completionAnimationStyle);
  }, [completionAnimationStyle]);

  useEffect(() => {
    setStoredValue("rawtype-animation-respect-reduced-motion", animationRespectReducedMotion);
  }, [animationRespectReducedMotion]);

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

    void import("./games/typing/services/runResults")
      .then(({ fetchTypingDailyActivity, fetchTypingStreakDays }) =>
        Promise.all([fetchTypingStreakDays(), fetchTypingDailyActivity()])
      )
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
      data-motion-intensity={effectiveAnimationIntensity}
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
            gameLanguage={gameLanguage}
            signedIn={Boolean(user)}
            wordDifficulty={wordDifficulty}
            wordNoMistakeMode={wordNoMistakeMode}
            wordsCount={wordsCount}
            onStartClassic={() => {
              dispatchPreferences({ type: "patch", updates: { typingMode: "sentences" } });
              updateAccountSettings({ default_typing_mode: "sentences" });
              setPlayingTypingGame(true);
            }}
            onStartWordMode={() => {
              dispatchPreferences({ type: "patch", updates: { typingMode: "words" } });
              updateAccountSettings({ default_typing_mode: "words" });
              setPlayingTypingGame(true);
            }}
            onWordDifficultyChange={handleDefaultWordDifficultyChange}
            onGameLanguageChange={handleGameLanguageChange}
            onWordNoMistakeModeChange={handleDefaultNoMistakeModeChange}
            onWordsCountChange={handleDefaultWordsCountChange}
          />
        )}

        <Suspense
          fallback={
            <section
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                padding: "20px",
                color: "var(--muted)"
              }}
            >
              Loading...
            </section>
          }
        >
        {route.kind === "games" && playingTypingGame && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "30px" }}>{gameTitle}</h1>
                <div style={{ marginTop: "6px", color: "var(--muted)", fontSize: "13px", fontWeight: 700 }}>
                  {gameMeta.join(" | ")}
                </div>
              </div>
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
              gameLanguage={gameLanguage}
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
              animationIntensity={effectiveAnimationIntensity}
              caretAnimationStyle={caretAnimationStyle}
              caretMovementAnimation={caretMovementAnimation}
              typingFeedbackAnimation={typingFeedbackAnimation}
              errorFeedbackAnimation={errorFeedbackAnimation}
              keyboardAnimationStyle={keyboardAnimationStyle}
              completionAnimationStyle={completionAnimationStyle}
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
            customFonts={visibleCustomFonts}
            fontImporting={fontImporting}
            fontImportError={fontImportError}
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
            animationIntensity={animationIntensity}
            effectiveAnimationIntensity={effectiveAnimationIntensity}
            caretAnimationStyle={caretAnimationStyle}
            caretMovementAnimation={caretMovementAnimation}
            typingFeedbackAnimation={typingFeedbackAnimation}
            errorFeedbackAnimation={errorFeedbackAnimation}
            keyboardAnimationStyle={keyboardAnimationStyle}
            completionAnimationStyle={completionAnimationStyle}
            animationRespectReducedMotion={animationRespectReducedMotion}
            onThemeChange={handleThemeChange}
            onAppFontChange={handleAppFontChange}
            onTextFontChange={handleTextFontChange}
            onImportFont={handleImportFont}
            onDeleteFont={handleDeleteFont}
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
            onAnimationIntensityChange={handleAnimationIntensityChange}
            onCaretAnimationStyleChange={handleCaretAnimationStyleChange}
            onCaretMovementAnimationChange={handleCaretMovementAnimationChange}
            onTypingFeedbackAnimationChange={handleTypingFeedbackAnimationChange}
            onErrorFeedbackAnimationChange={handleErrorFeedbackAnimationChange}
            onKeyboardAnimationStyleChange={handleKeyboardAnimationStyleChange}
            onCompletionAnimationStyleChange={handleCompletionAnimationStyleChange}
            onAnimationRespectReducedMotionChange={handleAnimationRespectReducedMotionChange}
            onCategoryChange={setActiveSettingsCategory}
          />
        )}

        {route.kind === "publicProfile" && (
          <PublicProfilePanel username={route.username} language={language} />
        )}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
