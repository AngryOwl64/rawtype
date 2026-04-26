// UI copy for RawType in each supported language.
// Exposes small getters so screens can resolve text by language.
import type { TypingLanguage } from "../games/typing/types";
import { resolveTypingLanguage } from "./language";

export type TypingServiceMessageKey =
  | "supabaseNotConfigured"
  | "sentencesLoadFailed"
  | "wordsLoadFailed"
  | "noProseTextsFound"
  | "noProseTextsAvailable"
  | "noWordsFound"
  | "noWordsAvailable"
  | "noWordsForDifficulty";

const APP_TEXTS = {
  en: {
    tabs: {
      games: "Games",
      stats: "Stats",
      settings: "Settings"
    },
    account: {
      loading: "Account",
      default: "Account",
      login: "Login"
    },
    home: {
      title: "Typing Practice",
      streak: "Streak",
      day: "day",
      days: "days",
      dailyActivity: "Daily Activity",
      classicTitle: "Typing Classic",
      classicDescription: "Standard prose mode with random text from the database.",
      startClassic: "Start Typing Classic",
      wordModeTitle: "Word Mode",
      wordModeDescription: "Random words generated.",
      noMistakeMode: "No Mistake Mode",
      words: "Words",
      difficulty: "Difficulty",
      on: "on",
      off: "off",
      easy: "easy",
      medium: "medium",
      hard: "hard",
      mixed: "mixed",
      wordsSuffix: "words",
      startWordMode: "Start Word Mode"
    },
    gameHeader: {
      title: "Typing Classic",
      wordsLabel: "Words",
      noMistakeLabel: "no-mistake",
      proseLabel: "Prose",
      backToMenu: "Back to Start Menu"
    }
  },
  de: {
    tabs: {
      games: "Spiele",
      stats: "Statistiken",
      settings: "Einstellungen"
    },
    account: {
      loading: "Konto",
      default: "Konto",
      login: "Login"
    },
    home: {
      title: "Tipp-Training",
      streak: "Serie",
      day: "Tag",
      days: "Tage",
      dailyActivity: "Tägliche Aktivität",
      classicTitle: "Typing Classic",
      classicDescription: "Standard-Prosa-Modus mit zufälligem Text aus der Datenbank.",
      startClassic: "Typing Classic starten",
      wordModeTitle: "Wortmodus",
      wordModeDescription: "Zufällige Wörter werden generiert.",
      noMistakeMode: "No-Mistake-Modus",
      words: "Wörter",
      difficulty: "Schwierigkeit",
      on: "an",
      off: "aus",
      easy: "leicht",
      medium: "mittel",
      hard: "schwer",
      mixed: "gemischt",
      wordsSuffix: "Wörter",
      startWordMode: "Wortmodus starten"
    },
    gameHeader: {
      title: "Typing Classic",
      wordsLabel: "Wörter",
      noMistakeLabel: "No-Mistake",
      proseLabel: "Prosa",
      backToMenu: "Zurück zum Startmenü"
    }
  }
} as const;

const SETTINGS_TEXTS = {
  en: {
    themeWindow: {
      ariaLabel: "Theme Window",
      title: "Theme",
      active: "Active",
      close: "Close",
      builtIn: "Built-in",
      community: "Community",
      creatorUploads: "Creator Uploads",
      comingSoon: "Coming soon",
      uploadComingSoon: "Upload support scaffolded, UI coming soon",
      cancel: "Cancel",
      applyTheme: "Apply Theme"
    },
    themeSection: {
      title: "Theme",
      active: "Active",
      openWindow: "Open Theme Window"
    },
    page: {
      title: "Settings",
      preview: "Preview",
      settingsCategories: "Settings categories",
      appearance: "Appearance",
      typing: "Typing",
      animations: "Animations",
      generalSettings: "General Settings",
      language: "Language",
      generalFont: "General Font",
      textFont: "Text Font",
      typingDefaults: "Typing Defaults",
      mode: "Mode",
      modeSentences: "Sentences",
      modeWords: "Words",
      wordCount: "Word Count",
      difficulty: "Difficulty",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      mixed: "Mixed",
      training: "Training",
      noMistakeMode: "No Mistake Mode",
      autoFocus: "Auto Focus Typing Area",
      showErrorBreakdown: "Show Error Breakdown",
      animationProfile: "Motion Profile",
      animationIntensity: "Motion Level",
      motionOff: "Off",
      motionCalm: "Calm",
      motionBalanced: "Balanced",
      motionExpressive: "Expressive",
      respectReducedMotion: "Respect System Reduced Motion",
      animationDetails: "Animation Details",
      caretAnimation: "Caret",
      caretSteady: "Steady Line",
      caretBlink: "Blinking Line",
      caretGlow: "Glow Trail",
      caretBlock: "Soft Block",
      caretUnderline: "Underline",
      caretMovementAnimation: "Cursor Movement",
      caretMovementSlide: "Glide",
      caretMovementInstant: "Direct",
      typingFeedbackAnimation: "Typing Feedback",
      animationNone: "None",
      typingFeedbackLift: "Lift",
      typingFeedbackPop: "Pop",
      typingFeedbackWave: "Wave",
      typingFeedbackInk: "Ink",
      errorFeedbackAnimation: "Error Feedback",
      errorFeedbackShake: "Shake",
      errorFeedbackFlash: "Flash",
      errorFeedbackSnap: "Snap",
      errorFeedbackGlitch: "Glitch",
      keyboardFeedbackAnimation: "Keyboard Feedback",
      keyboardFeedbackPress: "Press",
      keyboardFeedbackGlow: "Glow",
      keyboardFeedbackRipple: "Ripple",
      keyboardFeedbackTilt: "Tilt",
      completionAnimation: "Run Completion",
      completionPulse: "Pulse",
      completionConfetti: "Confetti",
      completionSparkles: "Sparkles",
      completionRibbons: "Ribbons",
      animationPreview: "Animation Preview",
      wordMarking: "Word Marking",
      correctWordMarker: "Correct Word Marker (Green)",
      changeCorrectColor: "Change Color (Correct)",
      errorMarker: "Error Marker From First Mistake (Red)",
      changeErrorColor: "Change Color (Error)",
      keyboard: "Keyboard",
      restartKey: "Restart Key",
      restartKeyEnter: "Return / Enter",
      restartKeyEscape: "Escape",
      showOnScreenKeyboard: "Show On-Screen Keyboard",
      keyboardLayout: "On-Screen Keyboard Layout",
      keyboardLayoutUs: "US QWERTY",
      keyboardLayoutUk: "UK QWERTY",
      keyboardLayoutDe: "German QWERTZ",
      keyboardLayoutFr: "French AZERTY",
      keyboardLayoutEs: "Spanish QWERTY",
      privacyData: "Privacy And Data",
      saveRuns: "Save Runs To Account",
      saveErrorWords: "Save Detailed Error Words",
      showErrorBreakdownPrivacy: "Show Error Breakdown After Runs",
      deleteSavedData: "Delete Saved Typing Data",
      deletingSavedData: "Deleting...",
      savedDataDeleted: "Saved Data Deleted",
      loginToDeleteData: "Login to delete saved account data.",
      deleteSavedDataTitle: "Delete Saved Typing Data?",
      deleteSavedDataDescription: "This removes saved runs and detailed error words from your account. This cannot be undone.",
      confirmDeleteSavedData: "Delete Data",
      deleteSavedDataFailed: "Could not delete saved data.",
      publicProfile: "Public Profile"
    }
  },
  de: {
    themeWindow: {
      ariaLabel: "Theme-Fenster",
      title: "Theme",
      active: "Aktiv",
      close: "Schließen",
      builtIn: "Integriert",
      community: "Community",
      creatorUploads: "Creator-Uploads",
      comingSoon: "Kommt bald",
      uploadComingSoon: "Upload-Unterstützung vorbereitet, UI folgt bald",
      cancel: "Abbrechen",
      applyTheme: "Theme anwenden"
    },
    themeSection: {
      title: "Theme",
      active: "Aktiv",
      openWindow: "Theme-Fenster öffnen"
    },
    page: {
      title: "Einstellungen",
      preview: "Vorschau",
      settingsCategories: "Einstellungskategorien",
      appearance: "Darstellung",
      typing: "Tippen",
      animations: "Animationen",
      generalSettings: "Allgemeine Einstellungen",
      language: "Sprache",
      generalFont: "Allgemeine Schrift",
      textFont: "Text-Schrift",
      typingDefaults: "Tippen-Standardwerte",
      mode: "Modus",
      modeSentences: "Sätze",
      modeWords: "Wörter",
      wordCount: "Wortanzahl",
      difficulty: "Schwierigkeit",
      easy: "Leicht",
      medium: "Mittel",
      hard: "Schwer",
      mixed: "Gemischt",
      training: "Training",
      noMistakeMode: "No-Mistake-Modus",
      autoFocus: "Typing-Bereich automatisch fokussieren",
      showErrorBreakdown: "Fehleraufschlüsselung anzeigen",
      animationProfile: "Bewegungsprofil",
      animationIntensity: "Bewegungsstärke",
      motionOff: "Aus",
      motionCalm: "Ruhig",
      motionBalanced: "Ausgewogen",
      motionExpressive: "Lebhaft",
      respectReducedMotion: "System-Bewegungsreduktion beachten",
      animationDetails: "Animationsdetails",
      caretAnimation: "Cursor",
      caretSteady: "Ruhige Linie",
      caretBlink: "Blinkende Linie",
      caretGlow: "Leuchtspur",
      caretBlock: "Weicher Block",
      caretUnderline: "Unterstrich",
      caretMovementAnimation: "Cursor-Bewegung",
      caretMovementSlide: "Gleitend",
      caretMovementInstant: "Direkt",
      typingFeedbackAnimation: "Tippfeedback",
      animationNone: "Keins",
      typingFeedbackLift: "Anheben",
      typingFeedbackPop: "Pop",
      typingFeedbackWave: "Welle",
      typingFeedbackInk: "Tinte",
      errorFeedbackAnimation: "Fehlerfeedback",
      errorFeedbackShake: "Wackeln",
      errorFeedbackFlash: "Blitz",
      errorFeedbackSnap: "Versatz",
      errorFeedbackGlitch: "Glitch",
      keyboardFeedbackAnimation: "Tastaturfeedback",
      keyboardFeedbackPress: "Drücken",
      keyboardFeedbackGlow: "Leuchten",
      keyboardFeedbackRipple: "Welle",
      keyboardFeedbackTilt: "Neigung",
      completionAnimation: "Run-Abschluss",
      completionPulse: "Fokus",
      completionConfetti: "Konfetti",
      completionSparkles: "Funken",
      completionRibbons: "Bänder",
      animationPreview: "Animationsvorschau",
      wordMarking: "Wort-Markierung",
      correctWordMarker: "Korrekte Wort-Markierung (Grün)",
      changeCorrectColor: "Farbe ändern (Korrekt)",
      errorMarker: "Fehlermarkierung ab erstem Fehler (Rot)",
      changeErrorColor: "Farbe ändern (Fehler)",
      keyboard: "Tastatur",
      restartKey: "Restart-Taste",
      restartKeyEnter: "Return / Enter",
      restartKeyEscape: "Escape",
      showOnScreenKeyboard: "Bildschirmtastatur anzeigen",
      keyboardLayout: "Bildschirmtastatur-Layout",
      keyboardLayoutUs: "US QWERTY",
      keyboardLayoutUk: "UK QWERTY",
      keyboardLayoutDe: "Deutsch QWERTZ",
      keyboardLayoutFr: "Französisch AZERTY",
      keyboardLayoutEs: "Spanisch QWERTY",
      privacyData: "Privatsphäre und Daten",
      saveRuns: "Runs im Konto speichern",
      saveErrorWords: "Detaillierte Fehlerwörter speichern",
      showErrorBreakdownPrivacy: "Fehleraufschlüsselung nach Runs anzeigen",
      deleteSavedData: "Gespeicherte Tippdaten löschen",
      deletingSavedData: "Lösche...",
      savedDataDeleted: "Gespeicherte Daten gelöscht",
      loginToDeleteData: "Logge dich ein, um gespeicherte Kontodaten zu löschen.",
      deleteSavedDataTitle: "Gespeicherte Tippdaten löschen?",
      deleteSavedDataDescription: "Das entfernt gespeicherte Runs und detaillierte Fehlerwörter aus deinem Konto. Das kann nicht rückgängig gemacht werden.",
      confirmDeleteSavedData: "Daten löschen",
      deleteSavedDataFailed: "Gespeicherte Daten konnten nicht gelöscht werden.",
      publicProfile: "Öffentliches Profil"
    }
  }
} as const;

const TYPING_GAME_TEXTS = {
  en: {
    onScreenKeyboard: "On-Screen Keyboard",
    loadingWords: "Generating random words from database...",
    loadingText: "Loading text from database...",
    retry: "Retry",
    metricAccuracy: "Accuracy",
    metricProgress: "Progress",
    metricErrors: "Errors",
    metricCategory: "Category",
    metricDifficulty: "Difficulty",
    reset: "Reset",
    runComplete: "Run Complete",
    noMistakeEnded: "No Mistake Mode: run ended after the first mistake.",
    savingRun: "Saving run...",
    runSaved: "Run saved to your account.",
    loginToSave: "Login to save this run to your stats.",
    saveDisabled: "Saving is turned off in Privacy And Data.",
    saveFailed: "Save failed",
    metricDuration: "Duration",
    metricKeystrokes: "Keystrokes",
    metricCorrectKeystrokes: "Correct Keystrokes",
    errorBreakdown: "Error Breakdown",
    noErrors: "No errors in this run.",
    totalErrors: "Total Errors",
    wordsAffected: "Words Affected",
    mostErrors: "Most Errors",
    wordLabel: "Word",
    characterLabel: "Character",
    wordMarkup: "Word Markup",
    typedLabel: "typed",
    expectedLabel: "Expected",
    restartHint: "Press {key} to play again.",
    playAgain: "Play Again"
  },
  de: {
    onScreenKeyboard: "Bildschirmtastatur",
    loadingWords: "Zufällige Wörter aus der Datenbank werden erzeugt...",
    loadingText: "Text wird aus der Datenbank geladen...",
    retry: "Erneut versuchen",
    metricAccuracy: "Genauigkeit",
    metricProgress: "Fortschritt",
    metricErrors: "Fehler",
    metricCategory: "Kategorie",
    metricDifficulty: "Schwierigkeit",
    reset: "Zurücksetzen",
    runComplete: "Run abgeschlossen",
    noMistakeEnded: "No-Mistake-Modus: Run wurde nach dem ersten Fehler beendet.",
    savingRun: "Run wird gespeichert...",
    runSaved: "Run wurde in deinem Konto gespeichert.",
    loginToSave: "Logge dich ein, um diesen Run in deinen Statistiken zu speichern.",
    saveDisabled: "Speichern ist unter Privatsphäre und Daten ausgeschaltet.",
    saveFailed: "Speichern fehlgeschlagen",
    metricDuration: "Dauer",
    metricKeystrokes: "Anschläge",
    metricCorrectKeystrokes: "Korrekte Anschläge",
    errorBreakdown: "Fehleraufschlüsselung",
    noErrors: "Keine Fehler in diesem Run.",
    totalErrors: "Fehler gesamt",
    wordsAffected: "Betroffene Wörter",
    mostErrors: "Meiste Fehler",
    wordLabel: "Wort",
    characterLabel: "Zeichen",
    wordMarkup: "Wort-Markup",
    typedLabel: "getippt",
    expectedLabel: "Erwartet",
    restartHint: "Drücke {key}, um nochmal zu spielen.",
    playAgain: "Nochmal spielen"
  }
} as const;

const STATS_TEXTS = {
  en: {
    noChange: "No change",
    fasterSuffix: "WPM faster",
    slowerSuffix: "WPM slower",
    noWpmData: "No WPM data yet.",
    averageWpm: "Average WPM",
    run: "run",
    runs: "runs",
    noDailyActivity: "No daily activity yet.",
    noRecurringMistakes: "No recurring mistakes yet.",
    errorSingular: "error",
    errorPlural: "errors",
    noModeData: "No mode data yet.",
    modeWords: "Word Mode",
    modeSentences: "Sentences",
    runsLabel: "Runs",
    bestWpmLabel: "Best WPM",
    avgWpmLabel: "Avg WPM",
    accuracyLabel: "Accuracy",
    errorFreeLabel: "Error-Free",
    timeLabel: "Time",
    couldNotLoad: "Could not load stats.",
    title: "Stats",
    supabaseNotConfigured: "Supabase is not configured.",
    loadingAccount: "Loading account...",
    loginPrompt: "Login to save runs and build your typing history.",
    loading: "Loading...",
    noSavedRuns: "No saved runs yet. Finish a run while logged in.",
    bestCpm: "Best CPM",
    bestAccuracy: "Best Accuracy",
    averageCpm: "Average CPM",
    practiceTime: "Practice Time",
    mistakes: "Mistakes",
    last5Avg: "Last 5 Avg",
    recentSpeed: "Recent Speed",
    streak: "Streak",
    errorFreeRuns: "Error-Free Runs",
    failedRuns: "Failed Runs",
    dailyActivity: "Daily Activity",
    modeBreakdown: "Mode Breakdown",
    worstWords: "Worst Words",
    recentRuns: "Recent Runs",
    wpm: "WPM",
    cpm: "CPM",
    errors: "Errors",
    words: "Words"
  },
  de: {
    noChange: "Keine Änderung",
    fasterSuffix: "WPM schneller",
    slowerSuffix: "WPM langsamer",
    noWpmData: "Noch keine WPM-Daten.",
    averageWpm: "Durchschnittliche WPM",
    run: "Run",
    runs: "Runs",
    noDailyActivity: "Noch keine tägliche Aktivität.",
    noRecurringMistakes: "Noch keine wiederkehrenden Fehler.",
    errorSingular: "Fehler",
    errorPlural: "Fehler",
    noModeData: "Noch keine Modusdaten.",
    modeWords: "Wortmodus",
    modeSentences: "Sätze",
    runsLabel: "Runs",
    bestWpmLabel: "Beste WPM",
    avgWpmLabel: "Ø WPM",
    accuracyLabel: "Genauigkeit",
    errorFreeLabel: "Fehlerfrei",
    timeLabel: "Zeit",
    couldNotLoad: "Statistiken konnten nicht geladen werden.",
    title: "Statistiken",
    supabaseNotConfigured: "Supabase ist nicht konfiguriert.",
    loadingAccount: "Konto wird geladen...",
    loginPrompt: "Logge dich ein, um Runs zu speichern und deinen Verlauf aufzubauen.",
    loading: "Laden...",
    noSavedRuns: "Noch keine gespeicherten Runs. Beende einen Run im eingeloggten Zustand.",
    bestCpm: "Beste CPM",
    bestAccuracy: "Beste Genauigkeit",
    averageCpm: "Durchschnittliche CPM",
    practiceTime: "Trainingszeit",
    mistakes: "Fehler",
    last5Avg: "Letzte 5 Ø",
    recentSpeed: "Aktuelle Geschwindigkeit",
    streak: "Serie",
    errorFreeRuns: "Fehlerfreie Runs",
    failedRuns: "Abgebrochene Runs",
    dailyActivity: "Tägliche Aktivität",
    modeBreakdown: "Modus-Aufschlüsselung",
    worstWords: "Schwierigste Wörter",
    recentRuns: "Letzte Runs",
    wpm: "WPM",
    cpm: "CPM",
    errors: "Fehler",
    words: "Wörter"
  }
} as const;

const TYPING_SERVICE_MESSAGES: Record<TypingLanguage, Record<TypingServiceMessageKey, string>> = {
  en: {
    supabaseNotConfigured: "Text source is not configured yet.",
    sentencesLoadFailed: "Texts could not be loaded right now. Please try again.",
    wordsLoadFailed: "Words could not be loaded right now. Please try again.",
    noProseTextsFound: "No texts available yet.",
    noProseTextsAvailable: "No texts available yet.",
    noWordsFound: "No words available yet.",
    noWordsAvailable: "No words available yet.",
    noWordsForDifficulty: "No words available for this difficulty yet."
  },
  de: {
    supabaseNotConfigured: "Textquelle ist noch nicht eingerichtet.",
    sentencesLoadFailed: "Texte konnten gerade nicht geladen werden. Bitte versuche es erneut.",
    wordsLoadFailed: "Wörter konnten gerade nicht geladen werden. Bitte versuche es erneut.",
    noProseTextsFound: "Bisher keine Texte vorhanden.",
    noProseTextsAvailable: "Bisher keine Texte vorhanden.",
    noWordsFound: "Bisher keine Wörter vorhanden.",
    noWordsAvailable: "Bisher keine Wörter vorhanden.",
    noWordsForDifficulty: "Für diesen Schwierigkeitsgrad sind bisher keine Wörter vorhanden."
  }
};

const DE_ACCOUNT_TRANSLATIONS: Record<string, string> = {
  "New account": "Neues Konto",
  Account: "Konto",
  Register: "Registrieren",
  "Could not load account stats.": "Kontostatistiken konnten nicht geladen werden.",
  "Email is required.": "E-Mail ist erforderlich.",
  "Username or email is required.": "Benutzername oder E-Mail ist erforderlich.",
  "Password is required.": "Passwort ist erforderlich.",
  "Passwords do not match.": "Passwörter stimmen nicht überein.",
  "Authentication failed.": "Authentifizierung fehlgeschlagen.",
  "Could not sign out.": "Abmelden war nicht möglich.",
  "New passwords do not match.": "Neue Passwörter stimmen nicht überein.",
  "Could not change password.": "Passwort konnte nicht geändert werden.",
  "Current password is required.": "Aktuelles Passwort ist erforderlich.",
  "Could not update username.": "Benutzername konnte nicht aktualisiert werden.",
  "Your profile row is missing in the database. Run frontend/supabase/backfill_existing_auth_accounts.sql once, then refresh account.":
    "Dein Profil-Datensatz fehlt in der Datenbank. Führe einmal frontend/supabase/backfill_existing_auth_accounts.sql aus und aktualisiere danach das Konto.",
  "Could not update profile visibility.": "Profilsichtbarkeit konnte nicht aktualisiert werden.",
  "Could not refresh account.": "Konto konnte nicht aktualisiert werden.",
  "Supabase is not configured. Add your Vite Supabase environment variables first.":
    "Supabase ist nicht konfiguriert. Füge zuerst deine Vite-Supabase-Umgebungsvariablen hinzu.",
  "Loading account...": "Konto wird geladen...",
  "Signed in as": "Angemeldet als",
  "Member since": "Mitglied seit",
  Synced: "Synchronisiert",
  Public: "Öffentlich",
  Private: "Privat",
  "Refreshing...": "Aktualisiere...",
  "Refresh Account": "Konto aktualisieren",
  Profile: "Profil",
  "View Profile": "Profil ansehen",
  Privacy: "Privatsphäre",
  Security: "Sicherheit",
  "Login to manage account settings.": "Logge dich ein, um Kontoeinstellungen zu verwalten.",
  "Public URL": "Öffentliche URL",
  Runs: "Runs",
  "Best WPM": "Beste WPM",
  Accuracy: "Genauigkeit",
  Streak: "Serie",
  Practice: "Training",
  "Account Settings": "Kontoeinstellungen",
  Username: "Benutzername",
  "Current Password": "Aktuelles Passwort",
  "After changing username, use the new username or your email for login.":
    "Nach der Änderung beim Login den neuen Benutzernamen oder deine E-Mail verwenden.",
  "Updating...": "Aktualisiere...",
  "Username Updated": "Benutzername aktualisiert",
  "Update Username": "Benutzername aktualisieren",
  "Profile Visibility": "Profilsichtbarkeit",
  "Public profiles can be used by profile pages to show your saved typing stats.":
    "Öffentliche Profile können auf Profilseiten deine gespeicherten Tipp-Statistiken anzeigen.",
  "Make Profile Private": "Profil privat machen",
  "Make Profile Public": "Profil öffentlich machen",
  "New Password": "Neues Passwort",
  "Confirm New Password": "Neues Passwort bestätigen",
  "Changing...": "Ändere...",
  "Password Changed": "Passwort geändert",
  "Change Password": "Passwort ändern",
  "Email Address": "E-Mail-Adresse",
  "No email connected": "Keine E-Mail verknüpft",
  "Change Email Unavailable": "E-Mail-Änderung nicht verfügbar",
  "Signing out...": "Abmeldung läuft...",
  Logout: "Abmelden",
  "Make Profile Public?": "Profil öffentlich machen?",
  "Are you sure you want to do this? After this, other people can see your public profile and saved typing stats.":
    "Bist du sicher? Danach können andere dein öffentliches Profil und deine gespeicherten Tipp-Statistiken sehen.",
  Cancel: "Abbrechen",
  "Make Public": "Öffentlich machen",
  Email: "E-Mail",
  "Username or Email": "Benutzername oder E-Mail",
  "name@example.com": "name@beispiel.de",
  "player_one or name@example.com": "player_one oder name@beispiel.de",
  Password: "Passwort",
  "Stay signed in": "Angemeldet bleiben",
  "Confirm password": "Passwort bestätigen",
  "Username only. Use 3-20 letters, numbers, or underscores.":
    "Nur Benutzername. Verwende 3-20 Buchstaben, Zahlen oder Unterstriche.",
  "Please wait...": "Bitte warten...",
  "Create account": "Konto erstellen"
};

const DE_AUTH_TRANSLATIONS: Record<string, string> = {
  "Something went wrong. Please try again.": "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  "Signup is blocked by Supabase's email rate limit. Turn off email confirmation in Supabase Auth, then wait for the current rate limit to reset.":
    "Die Registrierung ist durch Supabase-Rate-Limits für E-Mails blockiert. Deaktiviere die E-Mail-Bestätigung in Supabase Auth und warte, bis das aktuelle Rate-Limit zurückgesetzt ist.",
  "Username or password is incorrect.": "Benutzername oder Passwort ist falsch.",
  "Supabase is not configured.": "Supabase ist nicht konfiguriert.",
  "This username is already taken.": "Dieser Benutzername ist bereits vergeben.",
  "Please enter a valid email address.": "Bitte gib eine gültige E-Mail-Adresse ein.",
  "Please enter a valid username or email address.": "Bitte gib einen gültigen Benutzernamen oder eine gültige E-Mail-Adresse ein.",
  "Password is required.": "Passwort ist erforderlich.",
  "Password must be at least 8 characters.": "Passwort muss mindestens 8 Zeichen lang sein.",
  "Account profile is not loaded.": "Kontoprofil ist nicht geladen.",
  "Current password is required.": "Aktuelles Passwort ist erforderlich.",
  "Current account email is missing or invalid.": "Die aktuelle Konto-E-Mail fehlt oder ist ungültig.",
  "Account user is not loaded.": "Kontobenutzer ist nicht geladen.",
  "New password must be at least 8 characters.": "Neues Passwort muss mindestens 8 Zeichen lang sein.",
  "Database request failed.": "Datenbankanfrage fehlgeschlagen."
};

type UsernameValidationMessageKey = "tooShort" | "tooLong" | "invalidChars" | "reserved";

const USERNAME_VALIDATION_MESSAGES: Record<TypingLanguage, Record<UsernameValidationMessageKey, string>> = {
  en: {
    tooShort: "Username must be at least 3 characters.",
    tooLong: "Username must be 20 characters or less.",
    invalidChars: "Use only letters, numbers, and underscores.",
    reserved: "This username is reserved."
  },
  de: {
    tooShort: "Benutzername muss mindestens 3 Zeichen lang sein.",
    tooLong: "Benutzername darf höchstens 20 Zeichen lang sein.",
    invalidChars: "Nutze nur Buchstaben, Zahlen und Unterstriche.",
    reserved: "Dieser Benutzername ist reserviert."
  }
};

const LANGUAGE_LABELS: Record<TypingLanguage, string> = {
  en: "English",
  de: "Deutsch"
};

function resolve(language: string | null | undefined): TypingLanguage {
  return resolveTypingLanguage(language);
}

export function getAppTexts(language: string | null | undefined) {
  return APP_TEXTS[resolve(language)];
}

export function getSettingsTexts(language: string | null | undefined) {
  return SETTINGS_TEXTS[resolve(language)];
}

export function getTypingGameTexts(language: string | null | undefined) {
  return TYPING_GAME_TEXTS[resolve(language)];
}

export function getStatsTexts(language: string | null | undefined) {
  return STATS_TEXTS[resolve(language)];
}

export function getTypingServiceMessage(language: string | null | undefined, key: TypingServiceMessageKey) {
  return TYPING_SERVICE_MESSAGES[resolve(language)][key];
}

export function translateAccountText(language: string | null | undefined, englishText: string): string {
  if (resolve(language) !== "de") return englishText;
  return DE_ACCOUNT_TRANSLATIONS[englishText] ?? englishText;
}

export function translateAuthText(language: string | null | undefined, englishText: string): string {
  if (resolve(language) !== "de") return englishText;
  return DE_AUTH_TRANSLATIONS[englishText] ?? englishText;
}

export function getUsernameValidationMessageText(
  language: string | null | undefined,
  key: UsernameValidationMessageKey
) {
  return USERNAME_VALIDATION_MESSAGES[resolve(language)][key];
}

export function getLanguageLabelFromMessages(language: string | null | undefined): string {
  return LANGUAGE_LABELS[resolve(language)];
}

export function getLanguageOptionsFromMessages(): Array<{ value: TypingLanguage; label: string }> {
  return [
    { value: "en", label: LANGUAGE_LABELS.en },
    { value: "de", label: LANGUAGE_LABELS.de }
  ];
}
