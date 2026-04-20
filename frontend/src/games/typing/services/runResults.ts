import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../lib/database.types";
import type {
  SavedTypingDayStats,
  SavedTypingModeStats,
  SavedTypingRun,
  SavedTypingStats,
  TypingError,
  TypingMode,
  WordModeDifficulty,
  WordNoMistakeMode
} from "../types";
import { calculateCpm, calculateWpm } from "./typingMetrics";

type TypingRunInsert = Database["public"]["Tables"]["typing_runs"]["Insert"];
type TypingErrorInsert = Database["public"]["Tables"]["typing_errors"]["Insert"];
type TypingRunRow = Database["public"]["Tables"]["typing_runs"]["Row"];
type TypingErrorRow = Database["public"]["Tables"]["typing_errors"]["Row"];

export type CompletedTypingRun = {
  textId: string | null;
  mode: TypingMode;
  language: string;
  difficulty: WordModeDifficulty | null;
  wordsCount: number | null;
  noMistakeMode: WordNoMistakeMode;
  wpm: number;
  accuracy: number;
  durationMs: number;
  typedChars: number;
  correctChars: number;
  mistakes: number;
  completedWords: number;
  totalWords: number;
  failedByMistake: boolean;
  errorEvents: TypingError[];
};

type WorstWord = {
  word: string;
  mistakes: number;
};

type ModeAccumulator = {
  runs: TypingRunRow[];
  totalDurationMs: number;
  totalTypedChars: number;
  cleanRuns: number;
};

type DayAccumulator = {
  runs: number;
  totalWpm: number;
  totalDurationMs: number;
};

const displayedTypingModes: TypingMode[] = ["sentences", "words"];

function isUuid(value: string | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }

  return "Database request failed.";
}

export async function saveTypingRun(result: CompletedTypingRun): Promise<string> {
  const client = requireSupabaseClient();

  const runPayload: TypingRunInsert = {
    text_id: isUuid(result.textId) ? result.textId : null,
    mode: result.mode,
    language: result.language,
    difficulty: result.difficulty,
    words_count: result.wordsCount,
    no_mistake: result.noMistakeMode === "on",
    wpm: result.wpm,
    accuracy: result.accuracy,
    duration_ms: result.durationMs,
    typed_chars: result.typedChars,
    correct_chars: result.correctChars,
    mistakes: result.mistakes,
    completed_words: result.completedWords,
    total_words: result.totalWords,
    failed_by_mistake: result.failedByMistake
  };

  const { data: run, error: runError } = await client
    .from("typing_runs")
    .insert(runPayload)
    .select("id")
    .single();

  if (runError) throw new Error(getDatabaseErrorMessage(runError));

  if (result.errorEvents.length > 0) {
    const errorPayloads: TypingErrorInsert[] = result.errorEvents.map((entry) => ({
      run_id: run.id,
      word: entry.word,
      word_number: entry.wordNumber,
      char_position: entry.charPosition,
      expected: entry.expected,
      typed: entry.typed
    }));

    const { error: errorsError } = await client.from("typing_errors").insert(errorPayloads);
    if (errorsError) throw new Error(getDatabaseErrorMessage(errorsError));
  }

  return run.id;
}

function buildWorstWords(errors: TypingErrorRow[]): WorstWord[] {
  const counts = errors.reduce<Record<string, number>>((acc, entry) => {
    const word = entry.word.toLowerCase();
    acc[word] = (acc[word] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([word, mistakes]) => ({ word, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes || a.word.localeCompare(b.word))
    .slice(0, 5);
}

function getCpm(run: TypingRunRow): number {
  return calculateCpm(run.typed_chars, run.duration_ms);
}

function getAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildSavedRun(run: TypingRunRow): SavedTypingRun {
  return {
    ...run,
    cpm: getCpm(run)
  };
}

function buildModeStats(runs: TypingRunRow[]): SavedTypingModeStats[] {
  const groups = runs.reduce<Record<string, ModeAccumulator>>((acc, run) => {
    const group = acc[run.mode] ?? {
      runs: [],
      totalDurationMs: 0,
      totalTypedChars: 0,
      cleanRuns: 0
    };

    group.runs.push(run);
    group.totalDurationMs += run.duration_ms;
    group.totalTypedChars += run.typed_chars;
    if (run.mistakes === 0) group.cleanRuns += 1;
    acc[run.mode] = group;
    return acc;
  }, {});

  const modes = Array.from(new Set([...displayedTypingModes, ...Object.keys(groups)]));

  return modes
    .map((mode) => {
      const group = groups[mode] ?? {
        runs: [],
        totalDurationMs: 0,
        totalTypedChars: 0,
        cleanRuns: 0
      };

      return {
      mode,
      runs: group.runs.length,
      bestWpm: group.runs.reduce((best, run) => Math.max(best, run.wpm), 0),
      averageWpm: calculateWpm(group.totalTypedChars, group.totalDurationMs),
      averageAccuracy: getAverage(group.runs.map((run) => run.accuracy)),
      cleanRuns: group.cleanRuns,
      totalDurationMs: group.totalDurationMs
      };
    })
    .sort((a, b) => b.runs - a.runs || b.bestWpm - a.bestWpm);
}

function buildDailyActivity(runs: Array<{ created_at: string; duration_ms: number; wpm: number }>): SavedTypingDayStats[] {
  const groups = runs.reduce<Record<string, DayAccumulator>>((acc, run) => {
    const date = run.created_at.slice(0, 10);
    const group = acc[date] ?? { runs: 0, totalWpm: 0, totalDurationMs: 0 };

    group.runs += 1;
    group.totalWpm += run.wpm;
    group.totalDurationMs += run.duration_ms;
    acc[date] = group;
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([date, group]) => ({
      date,
      runs: group.runs,
      averageWpm: Math.round(group.totalWpm / group.runs),
      totalDurationMs: group.totalDurationMs
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
}

function getStreakDays(runs: Array<{ created_at: string }>): number {
  if (runs.length === 0) return 0;

  const activeDates = Array.from(new Set(runs.map((run) => run.created_at.slice(0, 10)))).sort((a, b) =>
    b.localeCompare(a)
  );
  let streak = 1;
  let previousDate = new Date(`${activeDates[0]}T00:00:00.000Z`);

  for (const date of activeDates.slice(1)) {
    const currentDate = new Date(`${date}T00:00:00.000Z`);
    const dayDelta = Math.round((previousDate.getTime() - currentDate.getTime()) / 86_400_000);

    if (dayDelta !== 1) break;
    streak += 1;
    previousDate = currentDate;
  }

  return streak;
}

function buildStats(runs: TypingRunRow[], errors: TypingErrorRow[]): SavedTypingStats {
  const bestRun = runs.reduce<TypingRunRow | null>((best, run) => {
    if (!best) return run;
    if (run.wpm > best.wpm) return run;
    if (run.wpm === best.wpm && run.accuracy > best.accuracy) return run;
    return best;
  }, null);
  const bestCpm = runs.reduce((best, run) => Math.max(best, getCpm(run)), 0);

  const totalRuns = runs.length;
  const totalAccuracy = runs.reduce((sum, run) => sum + run.accuracy, 0);
  const totalDurationMs = runs.reduce((sum, run) => sum + run.duration_ms, 0);
  const totalTypedChars = runs.reduce((sum, run) => sum + run.typed_chars, 0);
  const totalMistakes = runs.reduce((sum, run) => sum + run.mistakes, 0);
  const cleanRuns = runs.filter((run) => run.mistakes === 0).length;
  const failedRuns = runs.filter((run) => run.failed_by_mistake).length;
  const lastFiveRuns = runs.slice(0, 5);
  const previousFiveRuns = runs.slice(5, 10);
  const lastFiveAverageWpm = getAverage(lastFiveRuns.map((run) => run.wpm));
  const previousFiveAverageWpm = getAverage(previousFiveRuns.map((run) => run.wpm));

  return {
    totalRuns,
    bestWpm: bestRun?.wpm ?? 0,
    bestCpm,
    bestAccuracy: runs.reduce((best, run) => Math.max(best, run.accuracy), 0),
    averageWpm: calculateWpm(totalTypedChars, totalDurationMs),
    averageCpm: calculateCpm(totalTypedChars, totalDurationMs),
    averageAccuracy: totalRuns > 0 ? Math.round(totalAccuracy / totalRuns) : 0,
    cleanRuns,
    cleanRunRate: totalRuns > 0 ? Math.round((cleanRuns / totalRuns) * 100) : 0,
    failedRuns,
    currentStreakDays: getStreakDays(runs),
    lastFiveAverageWpm,
    previousFiveAverageWpm,
    wpmTrend: previousFiveAverageWpm > 0 ? lastFiveAverageWpm - previousFiveAverageWpm : 0,
    totalDurationMs,
    totalTypedChars,
    totalMistakes,
    modeStats: buildModeStats(runs),
    dailyActivity: buildDailyActivity(runs),
    wpmHistory: runs.slice(0, 12).reverse().map(buildSavedRun),
    recentRuns: runs.slice(0, 5).map(buildSavedRun),
    worstWords: buildWorstWords(errors)
  };
}

export async function fetchTypingStats(): Promise<SavedTypingStats> {
  const client = requireSupabaseClient();

  const [{ data: runs, error: runsError }, { data: errors, error: errorsError }] = await Promise.all([
    client.from("typing_runs").select("*").order("created_at", { ascending: false }),
    client.from("typing_errors").select("*").order("created_at", { ascending: false })
  ]);

  if (runsError) throw new Error(getDatabaseErrorMessage(runsError));
  if (errorsError) throw new Error(getDatabaseErrorMessage(errorsError));

  return buildStats(runs ?? [], errors ?? []);
}

export async function fetchTypingStreakDays(): Promise<number> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("typing_runs")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(370);

  if (error) throw new Error(getDatabaseErrorMessage(error));
  return getStreakDays(data ?? []);
}

export async function fetchTypingDailyActivity(): Promise<SavedTypingDayStats[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("typing_runs")
    .select("created_at, duration_ms, wpm")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) throw new Error(getDatabaseErrorMessage(error));
  return buildDailyActivity(data ?? []);
}
