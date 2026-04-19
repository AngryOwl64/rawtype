export type TypingError = {
  id: number;
  wordNumber: number;
  word: string;
  charPosition: number;
  expected: string;
  typed: string;
};
