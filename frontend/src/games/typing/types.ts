export type TypingError = {
  id: number;
  wordNumber: number;
  word: string;
  charPosition: number;
  expected: string;
  typed: string;
};

export type TypingMode = "sentences" | "words";
export type TypingLanguage = "en" | "de";
export type TypingFont = "system-mono" | "sans" | "serif";
export type WordModeDifficulty = "easy" | "medium" | "hard" | "mixed";
export type WordNoMistakeMode = "off" | "on";

export type TypingText = {
  id: string;
  content: string;
  category: string;
  difficulty: string;
  language: string;
  word_count: number;
  source: string | null;
};

export type SavedTypingRun = {
  id: string;
  mode: string;
  language: string;
  difficulty: string | null;
  words_count: number | null;
  no_mistake: boolean;
  wpm: number;
  cpm: number;
  accuracy: number;
  duration_ms: number;
  mistakes: number;
  completed_words: number;
  total_words: number;
  failed_by_mistake: boolean;
  created_at: string;
};

export type SavedTypingModeStats = {
  mode: string;
  runs: number;
  bestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  cleanRuns: number;
  totalDurationMs: number;
};

export type SavedTypingDayStats = {
  date: string;
  runs: number;
  averageWpm: number;
  totalDurationMs: number;
};

export type SavedTypingStats = {
  totalRuns: number;
  bestWpm: number;
  bestCpm: number;
  bestAccuracy: number;
  averageWpm: number;
  averageCpm: number;
  averageAccuracy: number;
  cleanRuns: number;
  cleanRunRate: number;
  failedRuns: number;
  currentStreakDays: number;
  lastFiveAverageWpm: number;
  previousFiveAverageWpm: number;
  wpmTrend: number;
  totalDurationMs: number;
  totalTypedChars: number;
  totalMistakes: number;
  modeStats: SavedTypingModeStats[];
  dailyActivity: SavedTypingDayStats[];
  wpmHistory: SavedTypingRun[];
  recentRuns: SavedTypingRun[];
  worstWords: Array<{
    word: string;
    mistakes: number;
  }>;
};
