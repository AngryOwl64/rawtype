import { useCallback, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { getRandomTypingText, getRandomTypingWordsText } from "../services/texts";
import {
  calculateAccuracy,
  calculateCorrectChars,
  calculateCpm,
  calculateWpm
} from "../services/typingMetrics";
import type {
  TypingError,
  TypingMode,
  TypingText,
  WordModeDifficulty,
  WordNoMistakeMode
} from "../types";

type UseTypingGameOptions = {
  mode?: TypingMode;
  wordsCount?: number;
  wordDifficulty?: WordModeDifficulty;
  wordNoMistakeMode?: WordNoMistakeMode;
  language?: string;
};

function normalizeTypingText(content: string): string {
  return content
    .replace(/\p{Cc}+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useTypingGame(options: UseTypingGameOptions = {}) {
  const mode = options.mode ?? "sentences";
  const wordsCount = Math.max(5, options.wordsCount ?? 25);
  const wordDifficulty = options.wordDifficulty ?? "mixed";
  const wordNoMistakeMode = options.wordNoMistakeMode ?? "off";
  const noMistakeActive = mode === "words" && wordNoMistakeMode === "on";
  const language = options.language ?? "en";

  const [activeText, setActiveText] = useState<TypingText | null>(null);
  const [text, setText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [typedChars, setTypedChars] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorEvents, setErrorEvents] = useState<TypingError[]>([]);
  const [isTextLoading, setIsTextLoading] = useState(true);
  const [textLoadError, setTextLoadError] = useState("");
  const [failedByMistake, setFailedByMistake] = useState(false);
  const countedMistakeWordNumbersRef = useRef<Set<number>>(new Set());

  const words = useMemo(() => normalizeTypingText(text).split(/\s+/).filter(Boolean), [text]);
  const finished = (!isTextLoading && words.length > 0 && currentWordIndex >= words.length) || failedByMistake;
  const currentWord = finished || words.length === 0 ? "" : words[currentWordIndex] ?? "";

  const reloadText = useCallback(async () => {
    setIsTextLoading(true);
    setTextLoadError("");

    const loader =
      mode === "words"
        ? getRandomTypingWordsText({ language, wordsCount, difficulty: wordDifficulty })
        : getRandomTypingText({ language });

    const { text: dbText, error } = await loader;

    if (error || !dbText) {
      setIsTextLoading(false);
      setTextLoadError(error ?? "Could not load text from database.");
      return;
    }

    setActiveText(dbText);
    setText(normalizeTypingText(dbText.content));
    setCurrentWordIndex(0);
    setCurrentInput("");
    setStartTime(null);
    setTypedChars(0);
    setMistakes(0);
    setElapsedMs(0);
    setErrorEvents([]);
    setFailedByMistake(false);
    countedMistakeWordNumbersRef.current = new Set();
    setIsTextLoading(false);
  }, [language, mode, wordsCount, wordDifficulty]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isTextLoading || words.length === 0) {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (currentInput.length > 0) {
        setCurrentInput("");
      }
      if (startTime !== null) {
        setElapsedMs(Date.now() - startTime);
      }
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (finished) {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (currentInput.length > 0) {
        setCurrentInput((prev) => prev.slice(0, -1));
      }
      if (startTime !== null) {
        setElapsedMs(Date.now() - startTime);
      }
      return;
    }

    if (event.key === " ") {
      event.preventDefault();

      if (currentInput === currentWord) {
        if (startTime !== null) {
          setElapsedMs(Date.now() - startTime);
        }
        setTypedChars((prev) => prev + 1);
        setCurrentWordIndex((prev) => prev + 1);
        setCurrentInput("");
      }
      return;
    }

    if (event.key.length !== 1) return;

    event.preventDefault();

    if (currentInput.length >= currentWord.length) {
      return;
    }

    const now = Date.now();

    if (startTime === null) {
      setStartTime(now);
      setElapsedMs(0);
    } else {
      setElapsedMs(now - startTime);
    }

    const charIndex = currentInput.length;
    const expectedChar = currentWord[charIndex];
    const nextInput = currentInput + event.key;
    const isLastWord = currentWordIndex === words.length - 1;
    const wordNumber = currentWordIndex + 1;

    if (!expectedChar || event.key !== expectedChar) {
      const alreadyCountedWordMistake = countedMistakeWordNumbersRef.current.has(wordNumber);

      if (!alreadyCountedWordMistake) {
        countedMistakeWordNumbersRef.current.add(wordNumber);
        setMistakes((prev) => prev + 1);
        setErrorEvents((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            wordNumber,
            word: currentWord,
            charPosition: charIndex + 1,
            expected: expectedChar ?? "(none)",
            typed: event.key
          }
        ]);
      }

      if (noMistakeActive) {
        setTypedChars((prev) => prev + 1);
        setCurrentInput(nextInput);
        setFailedByMistake(true);
        return;
      }
    }

    setTypedChars((prev) => prev + 1);
    setCurrentInput(nextInput);

    if (nextInput === currentWord && isLastWord) {
      setCurrentWordIndex(words.length);
    }
  }

  const accuracy = useMemo(() => {
    return calculateAccuracy(typedChars, mistakes);
  }, [typedChars, mistakes]);

  const wpm = useMemo(() => {
    return calculateWpm(typedChars, elapsedMs);
  }, [elapsedMs, typedChars]);

  const cpm = useMemo(() => {
    return calculateCpm(typedChars, elapsedMs);
  }, [elapsedMs, typedChars]);

  function restart() {
    void reloadText();
  }

  const correctChars = calculateCorrectChars(typedChars, mistakes);
  const completedWords = Math.min(currentWordIndex, words.length);
  const durationSeconds = Math.round((elapsedMs / 1000) * 10) / 10;

  return {
    activeText,
    words,
    currentWordIndex,
    currentInput,
    finished,
    isTextLoading,
    textLoadError,
    accuracy,
    wpm,
    cpm,
    typedChars,
    correctChars,
    mistakes,
    completedWords,
    totalWords: words.length,
    durationMs: elapsedMs,
    durationSeconds,
    errorEvents,
    restart,
    reloadText,
    mode,
    wordsCount,
    wordDifficulty,
    failedByMistake,
    noMistakeActive,
    handleKeyDown
  };
}
