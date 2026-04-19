export type TypingError = {
  id: number;
  wordNumber: number;
  word: string;
  charPosition: number;
  expected: string;
  typed: string;
};

export type TypingText = {
  id: string;
  content: string;
  category: string;
  difficulty: string;
  language: string;
  word_count: number;
  source: string | null;
};
