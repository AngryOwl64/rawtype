export { getRandomTypingText } from "./sentenceTexts";
export { getRandomTypingWordsText } from "./wordTexts";
import { clearSentenceTextCache } from "./sentenceTexts";
import { clearWordTextCache } from "./wordTexts";

export function clearTypingTextCache(language?: string) {
  clearSentenceTextCache(language);
  clearWordTextCache(language);
}
