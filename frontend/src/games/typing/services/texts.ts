import { supabase } from "../../../lib/supabase";
import type { TypingText } from "../types";

type GetRandomTypingTextOptions = {
  language?: string;
  batchSize?: number;
};

type GetRandomTypingWordsTextOptions = {
  language?: string;
  batchSize?: number;
  wordsCount?: number;
};

type WordDifficulty = "easy" | "medium" | "hard";
type WordsByDifficulty = Record<WordDifficulty, string[]>;
type WordDifficultyCounts = Record<WordDifficulty, number>;

const DEFAULT_TEXT_BATCH_SIZE = 24;
const DEFAULT_WORD_BATCH_SIZE = 160;
const WORD_FETCH_PAGE_SIZE = 1000;
const PREFETCH_THRESHOLD = 6;
const DEFAULT_WORDS_COUNT = 25;
const MIN_WORD_LENGTH = 2;
const WORD_DIFFICULTIES: WordDifficulty[] = ["easy", "medium", "hard"];
const WORD_DIFFICULTY_WEIGHTS: Record<WordDifficulty, number> = {
  easy: 0.35,
  medium: 0.35,
  hard: 0.3
};

const textCache = new Map<string, TypingText[]>();
const inFlightTextFetches = new Map<string, Promise<{ rows: TypingText[]; error: string | null }>>();
const lastServedTextId = new Map<string, string>();

const wordsCache = new Map<string, WordsByDifficulty>();
const inFlightWordFetches = new Map<
  string,
  Promise<{ wordsByDifficulty: WordsByDifficulty; error: string | null }>
>();

function getSentenceCacheKey(language: string): string {
  return `sentences:${language}`;
}

function getWordsCacheKey(language: string): string {
  return `words:${language}`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeTextContent(content: string): string {
  return content.replace(/\s+/g, " ").trim();
}

function normalizeWord(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/[^\p{L}\p{N}]+$/gu, "");
}

function createEmptyWordsByDifficulty(): WordsByDifficulty {
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

function countWordsInDifficultyPools(pools: WordsByDifficulty): number {
  return WORD_DIFFICULTIES.reduce((sum, difficulty) => sum + pools[difficulty].length, 0);
}

function normalizeWordDifficulty(raw: unknown): WordDifficulty | null {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  return null;
}

function classifyWordDifficultyFromLength(word: string): WordDifficulty {
  if (word.length <= 4) return "easy";
  if (word.length <= 7) return "medium";
  return "hard";
}

function buildWordDifficultyTargetCounts(wordsCount: number): WordDifficultyCounts {
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

function normalizeTextRow(row: {
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

async function fetchSentenceBatchFromDb(language: string, batchSize: number): Promise<{
  rows: TypingText[];
  error: string | null;
}> {
  if (!supabase) {
    return {
      rows: [],
      error:
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in frontend/.env.local."
    };
  }

  const { data, error } = await supabase
    .from("texts")
    .select("id, content, category, difficulty, language, word_count, source")
    .eq("language", language)
    .not("category", "ilike", "code")
    .limit(batchSize);

  if (error) {
    return { rows: [], error: error.message };
  }

  const validRows = (data ?? [])
    .filter((row) => typeof row.content === "string" && row.content.trim())
    .map(normalizeTextRow);

  return { rows: shuffle(validRows), error: null };
}

async function fetchWordsBatchFromDb(language: string, batchSize: number): Promise<{
  wordsByDifficulty: WordsByDifficulty;
  error: string | null;
}> {
  if (!supabase) {
    return {
      wordsByDifficulty: createEmptyWordsByDifficulty(),
      error:
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in frontend/.env.local."
    };
  }

  const labeledPools = createEmptyWordsByDifficulty();
  const fallbackLengthPools = createEmptyWordsByDifficulty();
  const pageSize = Math.max(100, Math.min(WORD_FETCH_PAGE_SIZE, batchSize));
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("words")
      .select("word, difficulty")
      .eq("language", language)
      .order("word", { ascending: true })
      .range(from, to);

    if (error) {
      return {
        wordsByDifficulty: createEmptyWordsByDifficulty(),
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      const normalized = normalizeWord(String(row.word ?? ""));
      if (normalized.length < MIN_WORD_LENGTH) continue;

      const lengthBasedDifficulty = classifyWordDifficultyFromLength(normalized);
      fallbackLengthPools[lengthBasedDifficulty].push(normalized);

      const labeledDifficulty = normalizeWordDifficulty(row.difficulty);
      if (labeledDifficulty) {
        labeledPools[labeledDifficulty].push(normalized);
      }
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  const wordsByDifficulty = createEmptyWordsByDifficulty();
  for (const difficulty of WORD_DIFFICULTIES) {
    const sourcePool =
      labeledPools[difficulty].length > 0 ? labeledPools[difficulty] : fallbackLengthPools[difficulty];
    wordsByDifficulty[difficulty] = shuffle(Array.from(new Set(sourcePool)));
  }

  return { wordsByDifficulty, error: null };
}

async function ensureSentenceBatchLoaded(language: string, batchSize: number): Promise<string | null> {
  const key = getSentenceCacheKey(language);
  const cached = textCache.get(key) ?? [];

  if (cached.length > 0) {
    return null;
  }

  let pending = inFlightTextFetches.get(key);
  if (!pending) {
    pending = fetchSentenceBatchFromDb(language, batchSize);
    inFlightTextFetches.set(key, pending);
  }

  const result = await pending;
  if (inFlightTextFetches.get(key) === pending) {
    inFlightTextFetches.delete(key);
  }

  if (result.error) {
    return result.error;
  }

  if (result.rows.length === 0) {
    return `No non-code texts found in database for language "${language}".`;
  }

  textCache.set(key, result.rows);
  return null;
}

async function ensureWordsBatchLoaded(language: string, batchSize: number): Promise<string | null> {
  const key = getWordsCacheKey(language);
  const cached = wordsCache.get(key);

  if (cached && countWordsInDifficultyPools(cached) > 0) {
    return null;
  }

  let pending = inFlightWordFetches.get(key);
  if (!pending) {
    pending = fetchWordsBatchFromDb(language, batchSize);
    inFlightWordFetches.set(key, pending);
  }

  const result = await pending;
  if (inFlightWordFetches.get(key) === pending) {
    inFlightWordFetches.delete(key);
  }

  if (result.error) {
    return result.error;
  }

  if (countWordsInDifficultyPools(result.wordsByDifficulty) === 0) {
    return `No words found in database for language "${language}".`;
  }

  wordsCache.set(key, result.wordsByDifficulty);
  return null;
}

function triggerSentencePrefetchIfNeeded(language: string, batchSize: number) {
  const key = getSentenceCacheKey(language);
  const cached = textCache.get(key) ?? [];

  if (cached.length >= PREFETCH_THRESHOLD || inFlightTextFetches.has(key)) {
    return;
  }

  const pending = fetchSentenceBatchFromDb(language, batchSize).then((result) => {
    inFlightTextFetches.delete(key);

    if (result.error || result.rows.length === 0) {
      return result;
    }

    const knownIds = new Set((textCache.get(key) ?? []).map((item) => item.id));
    const merged = [...(textCache.get(key) ?? [])];

    for (const row of result.rows) {
      if (!knownIds.has(row.id)) {
        merged.push(row);
        knownIds.add(row.id);
      }
    }

    textCache.set(key, merged);
    return result;
  });

  inFlightTextFetches.set(key, pending);
}

function pickSentenceFromCache(language: string): TypingText | null {
  const key = getSentenceCacheKey(language);
  const cached = textCache.get(key) ?? [];

  if (cached.length === 0) {
    return null;
  }

  const previousId = lastServedTextId.get(key);
  let pickIndex = Math.floor(Math.random() * cached.length);

  if (cached.length > 1 && previousId && cached[pickIndex]?.id === previousId) {
    pickIndex = (pickIndex + 1) % cached.length;
  }

  const [picked] = cached.splice(pickIndex, 1);
  textCache.set(key, cached);
  lastServedTextId.set(key, picked.id);
  return picked;
}

type PickWordsFromPoolOptions = {
  initialCounts?: Map<string, number>;
  maxPerInitial?: number;
  enforceInitialLimit?: boolean;
};

function pickWordsFromPool(
  pool: string[],
  wordsCount: number,
  options: PickWordsFromPoolOptions = {}
): string[] {
  if (pool.length === 0 || wordsCount <= 0) return [];

  const { initialCounts, maxPerInitial, enforceInitialLimit = false } = options;
  const useInitialBalance = Boolean(initialCounts) && typeof maxPerInitial === "number";

  if (!useInitialBalance) {
    if (wordsCount <= pool.length) {
      return shuffle(pool).slice(0, wordsCount);
    }

    const result = [...pool];
    while (result.length < wordsCount) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      result.push(pool[randomIndex]);
    }
    return result.slice(0, wordsCount);
  }

  const result: string[] = [];
  while (result.length < wordsCount) {
    const picked = takeWordWithInitialBalance(
      pool,
      initialCounts as Map<string, number>,
      maxPerInitial as number,
      enforceInitialLimit
    );
    if (!picked) {
      break;
    }

    result.push(picked);
    const initial = getWordInitial(picked);
    if (initial) {
      initialCounts!.set(initial, (initialCounts!.get(initial) ?? 0) + 1);
    }
  }

  return result;
}

function getWordInitial(word: string): string {
  const trimmed = word.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed[0] : "";
}

function takeWordWithInitialBalance(
  pool: string[],
  initialCounts: Map<string, number>,
  maxPerInitial: number,
  enforceInitialLimit = false
): string | null {
  if (pool.length === 0) return null;

  const preferredIndex = pool.findIndex((word) => {
    const initial = getWordInitial(word);
    if (!initial) return true;
    return (initialCounts.get(initial) ?? 0) < maxPerInitial;
  });

  if (preferredIndex < 0 && enforceInitialLimit) {
    return null;
  }

  const index = preferredIndex >= 0 ? preferredIndex : 0;
  const [picked] = pool.splice(index, 1);
  return picked ?? null;
}

function pickWordSequence(poolByDifficulty: WordsByDifficulty, wordsCount: number): string[] {
  const targetCounts = buildWordDifficultyTargetCounts(wordsCount);
  const selectedWords: string[] = [];
  const initialCounts = new Map<string, number>();
  const maxPerInitial = Math.max(2, Math.ceil(wordsCount * 0.14));
  const localPools: WordsByDifficulty = {
    easy: shuffle(poolByDifficulty.easy),
    medium: shuffle(poolByDifficulty.medium),
    hard: shuffle(poolByDifficulty.hard)
  };

  function pushSelectedWord(word: string) {
    selectedWords.push(word);
    const initial = getWordInitial(word);
    if (initial) {
      initialCounts.set(initial, (initialCounts.get(initial) ?? 0) + 1);
    }
  }

  for (const difficulty of WORD_DIFFICULTIES) {
    for (let i = 0; i < targetCounts[difficulty]; i += 1) {
      const nextWord = takeWordWithInitialBalance(
        localPools[difficulty],
        initialCounts,
        maxPerInitial,
        true
      );
      if (!nextWord) break;
      pushSelectedWord(nextWord);
    }
  }

  if (selectedWords.length < wordsCount) {
    const fallbackPool = shuffle(WORD_DIFFICULTIES.flatMap((difficulty) => localPools[difficulty]));
    const allFallbackWords = [...fallbackPool];
    if (fallbackPool.length === 0) {
      return [];
    }

    const strictRefillWords = pickWordsFromPool(fallbackPool, wordsCount - selectedWords.length, {
      initialCounts,
      maxPerInitial,
      enforceInitialLimit: true
    });
    for (const word of strictRefillWords) {
      selectedWords.push(word);
    }

    const relaxedRefillWords = pickWordsFromPool(fallbackPool, wordsCount - selectedWords.length, {
      initialCounts,
      maxPerInitial,
      enforceInitialLimit: false
    });
    for (const word of relaxedRefillWords) {
      selectedWords.push(word);
    }

    while (selectedWords.length < wordsCount && allFallbackWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * allFallbackWords.length);
      pushSelectedWord(allFallbackWords[randomIndex]);
    }
  }

  return shuffle(selectedWords).slice(0, wordsCount);
}

export async function getRandomTypingText(options: GetRandomTypingTextOptions = {}): Promise<{
  text: TypingText | null;
  error: string | null;
}> {
  const language = options.language ?? "en";
  const batchSize = Math.max(5, options.batchSize ?? DEFAULT_TEXT_BATCH_SIZE);

  const loadError = await ensureSentenceBatchLoaded(language, batchSize);
  if (loadError) {
    return { text: null, error: loadError };
  }

  const picked = pickSentenceFromCache(language);
  if (!picked) {
    return {
      text: null,
      error: `No non-code texts available for language "${language}".`
    };
  }

  triggerSentencePrefetchIfNeeded(language, batchSize);

  return { text: picked, error: null };
}

export async function getRandomTypingWordsText(
  options: GetRandomTypingWordsTextOptions = {}
): Promise<{ text: TypingText | null; error: string | null }> {
  const language = options.language ?? "en";
  const batchSize = Math.max(10, options.batchSize ?? DEFAULT_WORD_BATCH_SIZE);
  const wordsCount = Math.max(5, options.wordsCount ?? DEFAULT_WORDS_COUNT);

  const loadError = await ensureWordsBatchLoaded(language, batchSize);
  if (loadError) {
    return { text: null, error: loadError };
  }

  const poolByDifficulty = wordsCache.get(getWordsCacheKey(language));
  if (!poolByDifficulty || countWordsInDifficultyPools(poolByDifficulty) === 0) {
    return {
      text: null,
      error: `No words available for language "${language}".`
    };
  }

  const words = pickWordSequence(poolByDifficulty, wordsCount);

  return {
    text: {
      id: `generated-words-${language}-${Date.now()}`,
      content: words.join(" "),
      category: "words",
      difficulty: "mix-35-35-30",
      language,
      word_count: wordsCount,
      source: "words-table"
    },
    error: null
  };
}

export function clearTypingTextCache(language?: string) {
  if (language) {
    const sentenceKey = getSentenceCacheKey(language);
    const wordsKey = getWordsCacheKey(language);

    textCache.delete(sentenceKey);
    inFlightTextFetches.delete(sentenceKey);
    lastServedTextId.delete(sentenceKey);
    wordsCache.delete(wordsKey);
    inFlightWordFetches.delete(wordsKey);
    return;
  }

  textCache.clear();
  inFlightTextFetches.clear();
  lastServedTextId.clear();
  wordsCache.clear();
  inFlightWordFetches.clear();
}
