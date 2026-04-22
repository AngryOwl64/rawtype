// Built-in theme registry for RawType.
// Provides the known theme list and lookup helpers.
import type { ThemeId } from "./types";

export type BuiltInTheme = {
  id: ThemeId;
  name: string;
  description: string;
  swatches: {
    page: string;
    surface: string;
    text: string;
    accent: string;
  };
};

export const BUILT_IN_THEMES: ReadonlyArray<BuiltInTheme> = [
  {
    id: "pergament",
    name: "Pergament",
    description: "Warm, paper-like light theme.",
    swatches: {
      page: "#ece8df",
      surface: "#f7f4ee",
      text: "#232a33",
      accent: "#2f3742"
    }
  },
  {
    id: "monokai",
    name: "Monokai",
    description: "High-contrast dark theme.",
    swatches: {
      page: "#272822",
      surface: "#313327",
      text: "#f8f8f2",
      accent: "#66d9ef"
    }
  }
];

export function getBuiltInThemeName(themeId: ThemeId): string {
  return BUILT_IN_THEMES.find((theme) => theme.id === themeId)?.name ?? "Theme";
}
