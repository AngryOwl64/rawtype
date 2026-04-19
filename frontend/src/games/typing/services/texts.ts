import { supabase } from "../../../lib/supabase";
import type { TypingText } from "../types";

type GetRandomTypingTextOptions = {
  language?: string;
  batchSize?: number;
};

const DEFAULT_BATCH_SIZE = 24;
const PREFETCH_THRESHOLD = 6;

const textCache = new Map<string, TypingText[]>();
const inFlightFetches = new Map<string, Promise<{ rows: TypingText[]; error: string | null }>>();
const lastServedTextId = new Map<string, string>();

function getCacheKey(language: string): string {
  return `default:${language}`;
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

function normalizeRow(row: {
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

async function fetchBatchFromDb(language: string, batchSize: number): Promise<{
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
    .map(normalizeRow);

  return { rows: shuffle(validRows), error: null };
}

async function ensureBatchLoaded(language: string, batchSize: number): Promise<string | null> {
  const key = getCacheKey(language);
  const cached = textCache.get(key) ?? [];

  if (cached.length > 0) {
    return null;
  }

  let pending = inFlightFetches.get(key);
  if (!pending) {
    pending = fetchBatchFromDb(language, batchSize);
    inFlightFetches.set(key, pending);
  }

  const result = await pending;
  if (inFlightFetches.get(key) === pending) {
    inFlightFetches.delete(key);
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

function triggerPrefetchIfNeeded(language: string, batchSize: number) {
  const key = getCacheKey(language);
  const cached = textCache.get(key) ?? [];

  if (cached.length >= PREFETCH_THRESHOLD || inFlightFetches.has(key)) {
    return;
  }

  const pending = fetchBatchFromDb(language, batchSize).then((result) => {
    inFlightFetches.delete(key);

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

  inFlightFetches.set(key, pending);
}

function pickFromCache(language: string): TypingText | null {
  const key = getCacheKey(language);
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
  const batchSize = Math.max(5, options.batchSize ?? DEFAULT_BATCH_SIZE);

  const loadError = await ensureBatchLoaded(language, batchSize);
  if (loadError) {
    return { text: null, error: loadError };
  }

  const picked = pickFromCache(language);
  if (!picked) {
    return {
      text: null,
      error: `No non-code texts available for language "${language}".`
    };
  }

  triggerPrefetchIfNeeded(language, batchSize);

  return { text: picked, error: null };
}

export function clearTypingTextCache(language?: string) {
  if (language) {
    const key = getCacheKey(language);
    textCache.delete(key);
    inFlightFetches.delete(key);
    lastServedTextId.delete(key);
    return;
  }

  textCache.clear();
  inFlightFetches.clear();
  lastServedTextId.clear();
}
