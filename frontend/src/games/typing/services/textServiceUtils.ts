// Shared helpers for typing text services.
// Handles Supabase checks, fallbacks, and random selection.
import type { TypingText, WordModeDifficulty } from "../types";
import {
  getTypingServiceMessage as getTypingServiceMessageFromI18n,
  type TypingServiceMessageKey
} from "../../../i18n/messages";

export type GetRandomTypingTextOptions = {
  language?: string;
  batchSize?: number;
};

export type GetRandomTypingWordsTextOptions = {
  language?: string;
  batchSize?: number;
  wordsCount?: number;
  difficulty?: WordModeDifficulty;
};

export type WordDifficulty = Exclude<WordModeDifficulty, "mixed">;
export type WordsByDifficulty = Record<WordDifficulty, string[]>;
type WordDifficultyCounts = Record<WordDifficulty, number>;

export function getTypingServiceMessage(language: string | null | undefined, key: TypingServiceMessageKey) {
  return getTypingServiceMessageFromI18n(language, key);
}

export const DEFAULT_TEXT_BATCH_SIZE = 24;
export const DEFAULT_WORD_BATCH_SIZE = 160;
export const WORD_FETCH_PAGE_SIZE = 1000;
export const PREFETCH_THRESHOLD = 6;
export const DEFAULT_WORDS_COUNT = 25;
export const MIN_WORD_LENGTH = 2;

export const WORD_DIFFICULTIES: WordDifficulty[] = ["easy", "medium", "hard"];
const WORD_DIFFICULTY_WEIGHTS: Record<WordDifficulty, number> = {
  easy: 0.35,
  medium: 0.35,
  hard: 0.3
};

export function getSentenceCacheKey(language: string): string {
  return `sentences:${language}`;
}

export function getWordsCacheKey(language: string): string {
  return `words:${language}`;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeTextContent(content: string): string {
  return content.replace(/\s+/g, " ").trim();
}

export function normalizeWord(raw: string, language: string = "en"): string {
  const normalized = raw
    .trim()
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/[^\p{L}\p{N}]+$/gu, "");

  // Keep capitalization in German word mode (e.g. nouns like "Haus", "Baum").
  if (language === "de") {
    return normalized;
  }

  return normalized.toLowerCase();
}

export function createEmptyWordsByDifficulty(): WordsByDifficulty {
  return {
    easy: [],
    medium: [],
    hard: []
  };
}

function createEmptyWordDifficultyCounts(): WordDifficultyCounts {
  return {
    easy: 0,
    medium: 0,
    hard: 0
  };
}

export function countWordsInDifficultyPools(pools: WordsByDifficulty): number {
  return WORD_DIFFICULTIES.reduce((sum, difficulty) => sum + pools[difficulty].length, 0);
}

export function normalizeWordDifficulty(raw: unknown): WordDifficulty | null {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  return null;
}

export function classifyWordDifficultyFromLength(word: string): WordDifficulty {
  if (word.length <= 4) return "easy";
  if (word.length <= 7) return "medium";
  return "hard";
}

export function buildWordDifficultyTargetCounts(wordsCount: number): Record<WordDifficulty, number> {
  const targets = createEmptyWordDifficultyCounts();
  const remainders: Array<{ difficulty: WordDifficulty; remainder: number }> = [];

  for (const difficulty of WORD_DIFFICULTIES) {
    const weightedCount = wordsCount * WORD_DIFFICULTY_WEIGHTS[difficulty];
    const flooredCount = Math.floor(weightedCount);
    targets[difficulty] = flooredCount;
    remainders.push({
      difficulty,
      remainder: weightedCount - flooredCount
    });
  }

  let remaining = wordsCount - (targets.easy + targets.medium + targets.hard);

  remainders.sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return WORD_DIFFICULTIES.indexOf(a.difficulty) - WORD_DIFFICULTIES.indexOf(b.difficulty);
  });

  let index = 0;
  while (remaining > 0) {
    const nextDifficulty = remainders[index % remainders.length]?.difficulty;
    if (!nextDifficulty) break;
    targets[nextDifficulty] += 1;
    remaining -= 1;
    index += 1;
  }

  return targets;
}

export function normalizeTextRow(row: {
  id: string;
  content: string;
  category: string;
  difficulty: string;
  language: string;
  word_count: number;
  source: string | null;
}): TypingText {
  return {
    id: row.id,
    content: normalizeTextContent(row.content),
    category: String(row.category),
    difficulty: String(row.difficulty),
    language: row.language,
    word_count: row.word_count,
    source: row.source
  };
}
