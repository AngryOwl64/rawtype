export type TypingError = {
  id: number;
  wordNumber: number;
  word: string;
  charPosition: number;
  expected: string;
  typed: string;
};

export type TypingMode = "sentences" | "words";
export type WordModeDifficulty = "easy" | "medium" | "hard" | "mixed";
export type WordNoMistakeMode = "off" | "on";

export type TypingText = {
  id: string;
  content: string;
  category: string;
  difficulty: string;
  language: string;
  word_count: number;
  source: string | null;
};
