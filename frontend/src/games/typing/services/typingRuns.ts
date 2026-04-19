import { supabase } from "../../../lib/supabase";
import type { TypingError } from "../types";

export type SaveTypingRunInput = {
  mode: string;
  wpm: number;
  accuracy: number;
  durationSeconds: number;
  typedChars: number;
  correctChars: number;
  mistakes: number;
  totalWords: number;
  completedWords: number;
  errorEvents: TypingError[];
};

export async function saveTypingRun(input: SaveTypingRunInput): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error:
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in frontend/.env.local."
    };
  }

  const { error } = await supabase.from("typing_runs").insert({
    mode: input.mode,
    wpm: input.wpm,
    accuracy: input.accuracy,
    duration_seconds: input.durationSeconds,
    typed_chars: input.typedChars,
    correct_chars: input.correctChars,
    mistakes: input.mistakes,
    total_words: input.totalWords,
    completed_words: input.completedWords,
    error_events: input.errorEvents
  });

  return { error: error ? error.message : null };
}
