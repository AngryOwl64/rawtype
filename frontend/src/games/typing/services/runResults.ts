import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../lib/database.types";
import type {
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

  return {
    totalRuns,
    bestWpm: bestRun?.wpm ?? 0,
    bestCpm,
    averageWpm: calculateWpm(totalTypedChars, totalDurationMs),
    averageCpm: calculateCpm(totalTypedChars, totalDurationMs),
    averageAccuracy: totalRuns > 0 ? Math.round(totalAccuracy / totalRuns) : 0,
    totalDurationMs,
    totalTypedChars,
    totalMistakes,
    recentRuns: runs.slice(0, 5).map((run) => ({
      ...run,
      cpm: getCpm(run)
    })),
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
