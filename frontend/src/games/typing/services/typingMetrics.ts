// Metric calculations for typing speed and accuracy.
// Keeps WPM, CPM, and accuracy formulas reusable.
export function calculateCpm(correctChars: number, durationMs: number): number {
  if (correctChars <= 0 || durationMs <= 0) return 0;
  return Math.round(correctChars / (durationMs / 60000));
}

export function calculateWpm(typedChars: number, durationMs: number): number {
  if (typedChars <= 0 || durationMs <= 0) return 0;
  return Math.round((typedChars / 5) / (durationMs / 60000));
}

export function calculateAccuracy(typedChars: number, correctChars: number): number {
  if (typedChars <= 0) return 100;

  return Math.round((Math.min(correctChars, typedChars) / typedChars) * 100);
}
