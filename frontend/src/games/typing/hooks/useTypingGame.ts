import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { TYPING_TEXTS } from "../data/texts";
import type { TypingError } from "../types";

function getRandomText() {
  return TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
}

export function useTypingGame() {
  const [text, setText] = useState(getRandomText());
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [typedChars, setTypedChars] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorEvents, setErrorEvents] = useState<TypingError[]>([]);

  const words = useMemo(() => text.split(" "), [text]);
  const finished = currentWordIndex >= words.length;
  const currentWord = finished ? "" : words[currentWordIndex];

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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

    if (!expectedChar || event.key !== expectedChar) {
      setMistakes((prev) => prev + 1);
      setErrorEvents((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          wordNumber: currentWordIndex + 1,
          word: currentWord,
          charPosition: charIndex + 1,
          expected: expectedChar ?? "(none)",
          typed: event.key
        }
      ]);
    }

    setTypedChars((prev) => prev + 1);
    setCurrentInput(nextInput);

    if (nextInput === currentWord && isLastWord) {
      setCurrentWordIndex(words.length);
    }
  }

  const accuracy = useMemo(() => {
    if (typedChars === 0) return 100;
    const correct = typedChars - mistakes;
    return Math.max(0, Math.round((correct / typedChars) * 100));
  }, [typedChars, mistakes]);

  const wpm = useMemo(() => {
    if (elapsedMs <= 0 || typedChars === 0) return 0;
    const minutes = elapsedMs / 60000;
    if (minutes <= 0) return 0;
    return Math.round((typedChars / 5) / minutes);
  }, [elapsedMs, typedChars]);

  function restart() {
    setText(getRandomText());
    setCurrentWordIndex(0);
    setCurrentInput("");
    setStartTime(null);
    setTypedChars(0);
    setMistakes(0);
    setElapsedMs(0);
    setErrorEvents([]);
  }

  const correctChars = typedChars - mistakes;
  const completedWords = Math.min(currentWordIndex, words.length);
  const durationSeconds = Math.round((elapsedMs / 1000) * 10) / 10;

  return {
    words,
    currentWordIndex,
    currentInput,
    finished,
    accuracy,
    wpm,
    typedChars,
    correctChars,
    mistakes,
    completedWords,
    totalWords: words.length,
    durationSeconds,
    errorEvents,
    restart,
    handleKeyDown
  };
}
