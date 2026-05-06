// Builds generated prompts for custom mode from the existing word source.
import { DEFAULT_CUSTOM_TYPING_SETTINGS, normalizePinnedWordsInput } from "../customSettings";
import type { CustomLetterFocus, CustomTypingSettings, TypingText } from "../types";
import { DEFAULT_WORD_BATCH_SIZE, normalizeWord, shuffle } from "./textServiceUtils";
import { getRandomTypingWordsText } from "./wordTexts";

type GetRandomCustomTypingTextOptions = {
  language?: string;
  messageLanguage?: string;
  settings?: CustomTypingSettings;
};

const CUSTOM_BASE_WORD_COUNT = 140;
const CUSTOM_TARGET_WORD_COUNT = 58;
const FOCUS_MIN_SCORE = 0.62;

const FOCUS_LETTERS: Record<Exclude<CustomLetterFocus, "balanced">, string> = {
  "home-row": "asdfghjklöä",
  "top-row": "qwertzuiopü",
  "left-hand": "qwertasdfgyxcvb",
  "right-hand": "zuiophjklöäübnm"
};

const SYMBOLS = ["#", "+", "=", "/", "_", "%"];
const LIGHT_PUNCTUATION = [".", ",", "?"];
const DENSE_PUNCTUATION = [",", ";", ":", "?", "!"];

function getWordScoreForFocus(word: string, focus: Exclude<CustomLetterFocus, "balanced">): number {
  const letters = Array.from(word.toLowerCase()).filter((char) => /\p{L}/u.test(char));
  if (letters.length === 0) return 0;

  const focusedLetters = FOCUS_LETTERS[focus];
  const hits = letters.filter((char) => focusedLetters.includes(char)).length;
  return hits / letters.length;
}

function applyLetterFocus(words: string[], focus: CustomLetterFocus): string[] {
  if (focus === "balanced") return words;

  const focused = words.filter((word) => getWordScoreForFocus(word, focus) >= FOCUS_MIN_SCORE);
  return focused.length >= Math.ceil(CUSTOM_TARGET_WORD_COUNT * 0.45) ? focused : words;
}

function parsePinnedWords(value: string, language: string): string[] {
  const uniqueWords = new Set<string>();

  for (const word of normalizePinnedWordsInput(value).split(/,\s*/u)) {
    const normalized = normalizeWord(word, language);
    if (normalized) uniqueWords.add(normalized);
  }

  return Array.from(uniqueWords);
}

function buildBaseSequence(words: string[], pinnedWords: string[], settings: CustomTypingSettings): string[] {
  const pool = shuffle(words);
  const result: string[] = [];
  const pinnedStride = settings.repeats === "dense" ? 5 : settings.repeats === "light" ? 7 : 10;

  for (let index = 0; index < CUSTOM_TARGET_WORD_COUNT; index += 1) {
    if (pinnedWords.length > 0 && index % pinnedStride === 0) {
      result.push(pinnedWords[Math.floor(index / pinnedStride) % pinnedWords.length]);
      continue;
    }

    result.push(pool[index % pool.length]);
  }

  return result;
}

function applyRepeats(words: string[], settings: CustomTypingSettings): string[] {
  if (settings.repeats === "none") return words;

  const interval = settings.repeats === "dense" ? 5 : 9;
  return words.map((word, index) => {
    if (index < 2 || index % interval !== 0) return word;
    return words[index - (index % 3) - 1] ?? word;
  });
}

function applyRhythm(words: string[], settings: CustomTypingSettings): string[] {
  if (settings.rhythm !== "staggered") return words;

  const chunkSize = 6;
  const result: string[] = [];

  for (let index = 0; index < words.length; index += chunkSize) {
    const chunk = words.slice(index, index + chunkSize);
    result.push(...(Math.floor(index / chunkSize) % 2 === 0 ? chunk : chunk.reverse()));
  }

  return result;
}

function titleCase(word: string): string {
  const chars = Array.from(word);
  const [firstChar, ...rest] = chars;
  return firstChar ? `${firstChar.toLocaleUpperCase()}${rest.join("").toLocaleLowerCase()}` : word;
}

function applyCasing(word: string, settings: CustomTypingSettings): string {
  if (settings.casing === "lowercase") return word.toLocaleLowerCase();
  if (settings.casing === "uppercase") return word.toLocaleUpperCase();
  if (settings.casing === "title") return titleCase(word);
  return word;
}

function appendNumbers(word: string, index: number, settings: CustomTypingSettings): string {
  if (settings.numbers === "none") return word;

  const interval = settings.numbers === "dense" ? 5 : 11;
  if ((index + 3) % interval !== 0) return word;

  const value = settings.numbers === "dense" ? (index * 17 + 31) % 1000 : (index * 7 + 13) % 100;
  return `${word}${value}`;
}

function appendSymbols(word: string, index: number, settings: CustomTypingSettings): string {
  if (settings.symbols === "none") return word;

  const interval = settings.symbols === "dense" ? 6 : 13;
  if ((index + 5) % interval !== 0) return word;

  return `${word}${SYMBOLS[index % SYMBOLS.length]}`;
}

function appendPunctuation(word: string, index: number, settings: CustomTypingSettings): string {
  if (settings.punctuation === "none") return word;

  const marks = settings.punctuation === "dense" ? DENSE_PUNCTUATION : LIGHT_PUNCTUATION;
  const interval =
    settings.punctuation === "dense"
      ? settings.rhythm === "bursts" ? 4 : 5
      : settings.rhythm === "bursts" ? 7 : 10;

  if ((index + 1) % interval !== 0) return word;
  return `${word}${marks[index % marks.length]}`;
}

function decorateWords(words: string[], settings: CustomTypingSettings): string[] {
  return words.map((word, index) => {
    const cased = applyCasing(word, settings);
    const withNumber = appendNumbers(cased, index, settings);
    const withSymbol = appendSymbols(withNumber, index, settings);
    return appendPunctuation(withSymbol, index, settings);
  });
}

function getCustomDifficultyLabel(settings: CustomTypingSettings): string {
  const denseControls = [settings.punctuation, settings.numbers, settings.symbols, settings.repeats].filter(
    (level) => level === "dense"
  ).length;

  if (denseControls >= 2) return "custom-dense";
  if (settings.letterFocus !== "balanced") return `custom-${settings.letterFocus}`;
  if (settings.rhythm !== "steady") return `custom-${settings.rhythm}`;
  return "custom";
}

export async function getRandomCustomTypingText({
  language = "en",
  messageLanguage = language,
  settings = DEFAULT_CUSTOM_TYPING_SETTINGS
}: GetRandomCustomTypingTextOptions = {}): Promise<{ text: TypingText | null; error: string | null }> {
  const source = await getRandomTypingWordsText({
    language,
    messageLanguage,
    batchSize: DEFAULT_WORD_BATCH_SIZE,
    wordsCount: CUSTOM_BASE_WORD_COUNT,
    difficulty: "mixed"
  });

  if (source.error || !source.text) {
    return source;
  }

  const sourceWords = source.text.content.split(/\s+/u).filter(Boolean);
  const focusedWords = applyLetterFocus(sourceWords, settings.letterFocus);
  const pinnedWords = parsePinnedWords(settings.pinnedWords, language);
  const baseWords = buildBaseSequence(focusedWords, pinnedWords, settings);
  const contentWords = decorateWords(applyRhythm(applyRepeats(baseWords, settings), settings), settings);

  return {
    text: {
      id: `generated-custom-${language}-${Date.now()}`,
      content: contentWords.join(" "),
      category: "custom",
      difficulty: getCustomDifficultyLabel(settings),
      language,
      word_count: contentWords.length,
      source: "custom-generator"
    },
    error: null
  };
}
