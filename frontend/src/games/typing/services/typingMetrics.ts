export function calculateCpm(typedChars: number, durationMs: number): number {
  if (typedChars <= 0 || durationMs <= 0) return 0;
  return Math.round(typedChars / (durationMs / 60000));
}

export function calculateWpm(typedChars: number, durationMs: number): number {
  if (typedChars <= 0 || durationMs <= 0) return 0;
  return Math.round((typedChars / 5) / (durationMs / 60000));
}

export function calculateAccuracy(typedChars: number, mistakes: number): number {
  if (typedChars <= 0) return 100;

  const correctChars = Math.max(0, typedChars - mistakes);
  return Math.round((correctChars / typedChars) * 100);
}

export function calculateCorrectChars(typedChars: number, mistakes: number): number {
  return Math.max(0, typedChars - mistakes);
}
