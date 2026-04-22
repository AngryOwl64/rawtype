// Public text-loading entry points for the typing game.
// Routes requests to sentence or word providers by mode.
export { getRandomTypingText } from "./sentenceTexts";
export { getRandomTypingWordsText } from "./wordTexts";
import { clearSentenceTextCache } from "./sentenceTexts";
import { clearWordTextCache } from "./wordTexts";

export function clearTypingTextCache(language?: string) {
  clearSentenceTextCache(language);
  clearWordTextCache(language);
}
