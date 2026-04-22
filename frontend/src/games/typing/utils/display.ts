import type { TypingMode, WordModeDifficulty } from "../types";

export function getSavedDifficulty(mode: TypingMode, wordDifficulty: WordModeDifficulty): WordModeDifficulty | null {
  if (mode === "words") return wordDifficulty;
  return null;
}

export function getFirstMismatchIndex(typedValue: string, targetWord: string): number {
  for (let index = 0; index < typedValue.length; index += 1) {
    if (typedValue[index] !== targetWord[index]) {
      return index;
    }
  }

  return -1;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(59, 123, 79, ${alpha})`;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
