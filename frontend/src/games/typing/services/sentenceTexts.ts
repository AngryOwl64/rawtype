import { supabase } from "../../../lib/supabase";
import type { TypingText } from "../types";
import {
  DEFAULT_TEXT_BATCH_SIZE,
  PREFETCH_THRESHOLD,
  SUPABASE_MISSING_CONFIG_ERROR,
  getSentenceCacheKey,
  normalizeTextRow,
  shuffle,
  type GetRandomTypingTextOptions
} from "./textServiceUtils";

const textCache = new Map<string, TypingText[]>();
const inFlightTextFetches = new Map<string, Promise<{ rows: TypingText[]; error: string | null }>>();
const lastServedTextId = new Map<string, string>();

async function fetchSentenceBatchFromDb(language: string, batchSize: number): Promise<{
  rows: TypingText[];
  error: string | null;
}> {
  if (!supabase) {
    return {
      rows: [],
      error: SUPABASE_MISSING_CONFIG_ERROR
    };
  }

  const { data, error } = await supabase
    .from("texts")
    .select("id, content, category, difficulty, language, word_count, source")
    .eq("language", language)
    .eq("category", "prose")
    .limit(batchSize);

  if (error) {
    return { rows: [], error: error.message };
  }

  const validRows = (data ?? [])
    .filter((row) => typeof row.content === "string" && row.content.trim())
    .map(normalizeTextRow);

  return { rows: shuffle(validRows), error: null };
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
    return `No prose texts found in database for language "${language}".`;
  }

  textCache.set(key, result.rows);
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
      error: `No prose texts available for language "${language}".`
    };
  }

  triggerSentencePrefetchIfNeeded(language, batchSize);

  return { text: picked, error: null };
}

export function clearSentenceTextCache(language?: string) {
  if (language) {
    const sentenceKey = getSentenceCacheKey(language);
    textCache.delete(sentenceKey);
    inFlightTextFetches.delete(sentenceKey);
    lastServedTextId.delete(sentenceKey);
    return;
  }

  textCache.clear();
  inFlightTextFetches.clear();
  lastServedTextId.clear();
}
