// Builds word-mode typing prompts from Supabase or fallback words.
// Filters by language and difficulty before selecting random words.
import { supabase } from "../../../lib/supabase";
import type { TypingText, WordModeDifficulty } from "../types";
import {
  DEFAULT_WORD_BATCH_SIZE,
  DEFAULT_WORDS_COUNT,
  MIN_WORD_LENGTH,
  WORD_DIFFICULTIES,
  WORD_FETCH_PAGE_SIZE,
  buildWordDifficultyTargetCounts,
  classifyWordDifficultyFromLength,
  countWordsInDifficultyPools,
  createEmptyWordsByDifficulty,
  getTypingServiceMessage,
  getWordsCacheKey,
  normalizeWord,
  normalizeWordDifficulty,
  shuffle,
  type GetRandomTypingWordsTextOptions,
  type WordDifficulty,
  type WordsByDifficulty
} from "./textServiceUtils";

const wordsCache = new Map<string, WordsByDifficulty>();
const inFlightWordFetches = new Map<
  string,
  Promise<{ wordsByDifficulty: WordsByDifficulty; error: string | null }>
>();

type PickWordsFromPoolOptions = {
  initialCounts?: Map<string, number>;
  maxPerInitial?: number;
  enforceInitialLimit?: boolean;
};

async function fetchWordsBatchFromDb(language: string, batchSize: number, messageLanguage: string): Promise<{
  wordsByDifficulty: WordsByDifficulty;
  error: string | null;
}> {
  if (!supabase) {
    return {
      wordsByDifficulty: createEmptyWordsByDifficulty(),
      error: getTypingServiceMessage(messageLanguage, "supabaseNotConfigured")
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
        error: getTypingServiceMessage(messageLanguage, "wordsLoadFailed")
      };
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      const normalized = normalizeWord(String(row.word ?? ""), language);
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

async function ensureWordsBatchLoaded(
  language: string,
  batchSize: number,
  messageLanguage: string
): Promise<string | null> {
  const key = getWordsCacheKey(language);
  const cached = wordsCache.get(key);

  if (cached && countWordsInDifficultyPools(cached) > 0) {
    return null;
  }

  let pending = inFlightWordFetches.get(key);
  if (!pending) {
    pending = fetchWordsBatchFromDb(language, batchSize, messageLanguage);
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
    return getTypingServiceMessage(messageLanguage, "noWordsFound");
  }

  wordsCache.set(key, result.wordsByDifficulty);
  return null;
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

function pickSingleDifficultyWordSequence(
  poolByDifficulty: WordsByDifficulty,
  wordsCount: number,
  difficulty: WordDifficulty
): string[] {
  const mutablePool = shuffle(poolByDifficulty[difficulty]);
  if (mutablePool.length === 0) {
    return [];
  }
  const refillSource = [...mutablePool];

  const selectedWords: string[] = [];
  const initialCounts = new Map<string, number>();
  const maxPerInitial = Math.max(2, Math.ceil(wordsCount * 0.14));

  const strictWords = pickWordsFromPool(mutablePool, wordsCount, {
    initialCounts,
    maxPerInitial,
    enforceInitialLimit: true
  });
  selectedWords.push(...strictWords);

  const relaxedWords = pickWordsFromPool(mutablePool, wordsCount - selectedWords.length, {
    initialCounts,
    maxPerInitial,
    enforceInitialLimit: false
  });
  selectedWords.push(...relaxedWords);

  while (selectedWords.length < wordsCount) {
    const randomIndex = Math.floor(Math.random() * refillSource.length);
    selectedWords.push(refillSource[randomIndex]);
  }

  return shuffle(selectedWords).slice(0, wordsCount);
}

export async function getRandomTypingWordsText(
  options: GetRandomTypingWordsTextOptions = {}
): Promise<{ text: TypingText | null; error: string | null }> {
  const language = options.language ?? "en";
  const messageLanguage = options.messageLanguage ?? language;
  const batchSize = Math.max(10, options.batchSize ?? DEFAULT_WORD_BATCH_SIZE);
  const wordsCount = Math.max(5, options.wordsCount ?? DEFAULT_WORDS_COUNT);
  const difficultyMode: WordModeDifficulty = options.difficulty ?? "mixed";

  const loadError = await ensureWordsBatchLoaded(language, batchSize, messageLanguage);
  if (loadError) {
    return { text: null, error: loadError };
  }

  const poolByDifficulty = wordsCache.get(getWordsCacheKey(language));
  if (!poolByDifficulty || countWordsInDifficultyPools(poolByDifficulty) === 0) {
    return {
      text: null,
      error: getTypingServiceMessage(messageLanguage, "noWordsAvailable")
    };
  }

  const words =
    difficultyMode === "mixed"
      ? pickWordSequence(poolByDifficulty, wordsCount)
      : pickSingleDifficultyWordSequence(poolByDifficulty, wordsCount, difficultyMode);

  if (words.length === 0) {
    return {
      text: null,
      error: getTypingServiceMessage(messageLanguage, "noWordsForDifficulty")
    };
  }

  const generatedDifficulty = difficultyMode === "mixed" ? "mix-35-35-30" : difficultyMode;

  return {
    text: {
      id: `generated-words-${language}-${Date.now()}`,
      content: words.join(" "),
      category: "words",
      difficulty: generatedDifficulty,
      language,
      word_count: wordsCount,
      source: "words-table"
    },
    error: null
  };
}

export function clearWordTextCache(language?: string) {
  if (language) {
    const wordsKey = getWordsCacheKey(language);
    wordsCache.delete(wordsKey);
    inFlightWordFetches.delete(wordsKey);
    return;
  }

  wordsCache.clear();
  inFlightWordFetches.clear();
}
