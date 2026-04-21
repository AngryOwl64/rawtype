import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../auth/authContext";
import { saveTypingRun } from "../services/runResults";
import { useTypingGame } from "../hooks/useTypingGame";
import type { TypingLanguage, TypingMode, WordModeDifficulty, WordNoMistakeMode } from "../types";

type TypingGameProps = {
  mode?: TypingMode;
  language?: TypingLanguage;
  wordsCount?: number;
  wordDifficulty?: WordModeDifficulty;
  wordNoMistakeMode?: WordNoMistakeMode;
  highlightCorrectWords?: boolean;
  highlightErrorFromPoint?: boolean;
  showOnScreenKeyboard?: boolean;
  correctMarkerColor?: string;
  errorMarkerColor?: string;
};

function getSavedDifficulty(mode: TypingMode, wordDifficulty: WordModeDifficulty): WordModeDifficulty | null {
  if (mode === "words") return wordDifficulty;
  return null;
}

function getFirstMismatchIndex(typedValue: string, targetWord: string): number {
  for (let index = 0; index < typedValue.length; index += 1) {
    if (typedValue[index] !== targetWord[index]) {
      return index;
    }
  }

  return -1;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(59, 123, 79, ${alpha})`;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type KeyboardKey = {
  id: string;
  label: string;
  width?: number;
};

const KEYBOARD_ROWS: ReadonlyArray<ReadonlyArray<KeyboardKey>> = [
  [
    { id: "esc", label: "Esc", width: 1.1 },
    { id: "1", label: "1" },
    { id: "2", label: "2" },
    { id: "3", label: "3" },
    { id: "4", label: "4" },
    { id: "5", label: "5" },
    { id: "6", label: "6" },
    { id: "7", label: "7" },
    { id: "8", label: "8" },
    { id: "9", label: "9" },
    { id: "0", label: "0" },
    { id: "-", label: "-" },
    { id: "=", label: "=" },
    { id: "backspace", label: "Backspace", width: 2.1 }
  ],
  [
    { id: "tab", label: "Tab", width: 1.5 },
    { id: "q", label: "Q" },
    { id: "w", label: "W" },
    { id: "e", label: "E" },
    { id: "r", label: "R" },
    { id: "t", label: "T" },
    { id: "y", label: "Y" },
    { id: "u", label: "U" },
    { id: "i", label: "I" },
    { id: "o", label: "O" },
    { id: "p", label: "P" },
    { id: "[", label: "[" },
    { id: "]", label: "]" },
    { id: "\\", label: "\\", width: 1.4 }
  ],
  [
    { id: "capslock", label: "Caps", width: 1.8 },
    { id: "a", label: "A" },
    { id: "s", label: "S" },
    { id: "d", label: "D" },
    { id: "f", label: "F" },
    { id: "g", label: "G" },
    { id: "h", label: "H" },
    { id: "j", label: "J" },
    { id: "k", label: "K" },
    { id: "l", label: "L" },
    { id: ";", label: ";" },
    { id: "'", label: "'" },
    { id: "enter", label: "Enter", width: 2.2 }
  ],
  [
    { id: "shift", label: "Shift", width: 2.3 },
    { id: "z", label: "Z" },
    { id: "x", label: "X" },
    { id: "c", label: "C" },
    { id: "v", label: "V" },
    { id: "b", label: "B" },
    { id: "n", label: "N" },
    { id: "m", label: "M" },
    { id: ",", label: "," },
    { id: ".", label: "." },
    { id: "/", label: "/" },
    { id: "shiftright", label: "Shift", width: 2.6 }
  ],
  [
    { id: "ctrl", label: "Ctrl", width: 1.4 },
    { id: "meta", label: "Meta", width: 1.4 },
    { id: "alt", label: "Alt", width: 1.4 },
    { id: "space", label: "Space", width: 6.2 },
    { id: "altgr", label: "AltGr", width: 1.4 },
    { id: "menu", label: "Menu", width: 1.4 },
    { id: "ctrlright", label: "Ctrl", width: 1.4 }
  ]
];

const KEYBOARD_GAP = 5;
const KEYBOARD_MIN_UNIT = 12;
const KEYBOARD_MAX_UNIT = 38;
const KEYBOARD_DEFAULT_UNIT = 28;

function normalizePressedKey(key: string): string | null {
  if (key.length === 1) return key.toLowerCase();

  if (key === " ") return "space";
  if (key === "Escape") return "esc";
  if (key === "Backspace") return "backspace";
  if (key === "Tab") return "tab";
  if (key === "CapsLock") return "capslock";
  if (key === "Enter") return "enter";
  if (key === "Shift") return "shift";
  if (key === "Control") return "ctrl";
  if (key === "Meta") return "meta";
  if (key === "Alt") return "alt";
  if (key === "AltGraph") return "altgr";
  if (key === "ContextMenu") return "menu";

  return null;
}

const OnScreenKeyboard = memo(function OnScreenKeyboard({ activeKeys }: { activeKeys: Set<string> }) {
  const keyboardWrapperRef = useRef<HTMLDivElement | null>(null);
  const [keyUnit, setKeyUnit] = useState(KEYBOARD_DEFAULT_UNIT);
  const keyHeight = Math.max(24, Math.round(keyUnit * 0.86));
  const keyFontSize = Math.max(10, Math.min(13, Math.round(keyUnit * 0.36)));
  const rowGeometry = useMemo(
    () =>
      KEYBOARD_ROWS.map((row) => ({
        units: row.reduce((sum, keyDef) => sum + (keyDef.width ?? 1), 0),
        gaps: Math.max(0, row.length - 1)
      })),
    []
  );

  useEffect(() => {
    function updateKeyUnit() {
      const availableWidth = Math.max(220, keyboardWrapperRef.current?.clientWidth ?? 0);
      const maxUnitForRows = rowGeometry.reduce((limit, row) => {
        const rowLimit = (availableWidth - row.gaps * KEYBOARD_GAP) / row.units;
        return Math.min(limit, rowLimit);
      }, Number.POSITIVE_INFINITY);

      const nextUnit = Number.isFinite(maxUnitForRows)
        ? Math.max(KEYBOARD_MIN_UNIT, Math.min(KEYBOARD_MAX_UNIT, maxUnitForRows))
        : KEYBOARD_DEFAULT_UNIT;

      setKeyUnit((previous) => {
        if (Math.abs(previous - nextUnit) < 0.3) return previous;
        return nextUnit;
      });
    }

    updateKeyUnit();

    const wrapper = keyboardWrapperRef.current;
    if (!wrapper) return;

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        updateKeyUnit();
      });
      resizeObserver.observe(wrapper);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", updateKeyUnit);
    return () => window.removeEventListener("resize", updateKeyUnit);
  }, [rowGeometry]);

  return (
    <section
      style={{
        width: "min(100%, 980px)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        backgroundColor: "var(--surface)",
        padding: "12px",
        display: "grid",
        gap: "6px"
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700 }}>On-Screen Keyboard</div>

      <div
        ref={keyboardWrapperRef}
        onMouseDown={(event) => event.preventDefault()}
        style={{
          display: "grid",
          gap: `${KEYBOARD_GAP}px`,
          justifyItems: "center"
        }}
      >
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: "flex", gap: `${KEYBOARD_GAP}px`, justifyContent: "center" }}>
            {row.map((keyDef, keyIndex) => {
              const width = keyDef.width ?? 1;
              const active =
                activeKeys.has(keyDef.id) ||
                (keyDef.id === "shiftright" && activeKeys.has("shift")) ||
                (keyDef.id === "ctrlright" && activeKeys.has("ctrl"));

              return (
                <span
                  key={`${rowIndex}-${keyIndex}`}
                  style={{
                    width: `${Math.round(keyUnit * width + (width - 1) * KEYBOARD_GAP)}px`,
                    height: `${keyHeight}px`,
                    border: `1px solid ${active ? "var(--primary)" : "var(--border-soft)"}`,
                    borderRadius: "6px",
                    backgroundColor: active ? "var(--primary)" : "var(--surface-soft)",
                    color: active ? "var(--primary-text)" : "var(--muted-strong)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: `${keyFontSize}px`,
                    fontWeight: 700,
                    userSelect: "none",
                    flex: "0 0 auto"
                  }}
                >
                  {keyDef.label}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
});

const MetricCard = memo(function MetricCard({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: "8px",
        padding: "10px",
        minHeight: compact ? "58px" : "66px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "4px" }}>{label}</div>
      <strong style={{ fontSize: compact ? "16px" : "22px" }}>{value}</strong>
    </div>
  );
});

export default function TypingGame({
  mode = "sentences",
  language = "en",
  wordsCount = 25,
  wordDifficulty = "mixed",
  wordNoMistakeMode = "off",
  highlightCorrectWords = true,
  highlightErrorFromPoint = true,
  showOnScreenKeyboard = false,
  correctMarkerColor = "#6fbf73",
  errorMarkerColor = "#c86b73"
}: TypingGameProps) {
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [activeKeyboardKeys, setActiveKeyboardKeys] = useState<Set<string>>(new Set());
  const savedRunKeyRef = useRef("");
  const keyReleaseTimersRef = useRef<Record<string, number>>({});
  const correctMarkerBackground = useMemo(() => hexToRgba(correctMarkerColor, 0.35), [correctMarkerColor]);
  const errorMarkerBackground = useMemo(() => hexToRgba(errorMarkerColor, 0.3), [errorMarkerColor]);
  const {
    activeText,
    words,
    currentWordIndex,
    currentInput,
    finished,
    isTextLoading,
    textLoadError,
    wpm,
    cpm,
    accuracy,
    typedChars,
    correctChars,
    mistakes,
    completedWords,
    totalWords,
    durationMs,
    durationSeconds,
    errorEvents,
    failedByMistake,
    noMistakeActive,
    restart,
    reloadText,
    handleKeyDown
  } = useTypingGame({ mode, wordsCount, wordDifficulty, wordNoMistakeMode, language });
  const typingAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void reloadText();
  }, [reloadText]);

  useEffect(() => {
    if (!finished && !isTextLoading && !textLoadError) {
      typingAreaRef.current?.focus();
    }
  }, [finished, isTextLoading, textLoadError]);

  useEffect(() => {
    if (!showOnScreenKeyboard) {
      setActiveKeyboardKeys(new Set());
      return;
    }

    function clearReleaseTimer(keyId: string) {
      const timerId = keyReleaseTimersRef.current[keyId];
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        delete keyReleaseTimersRef.current[keyId];
      }
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      const keyId = normalizePressedKey(event.key);
      if (!keyId) return;

      clearReleaseTimer(keyId);
      setActiveKeyboardKeys((previous) => {
        const next = new Set(previous);
        next.add(keyId);
        return next;
      });
    }

    function handleWindowKeyUp(event: KeyboardEvent) {
      const keyId = normalizePressedKey(event.key);
      if (!keyId) return;

      clearReleaseTimer(keyId);
      keyReleaseTimersRef.current[keyId] = window.setTimeout(() => {
        setActiveKeyboardKeys((previous) => {
          if (!previous.has(keyId)) return previous;
          const next = new Set(previous);
          next.delete(keyId);
          return next;
        });
        delete keyReleaseTimersRef.current[keyId];
      }, 120);
    }

    function handleWindowBlur() {
      setActiveKeyboardKeys(new Set());
      Object.values(keyReleaseTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      keyReleaseTimersRef.current = {};
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("keyup", handleWindowKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("keyup", handleWindowKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      Object.values(keyReleaseTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      keyReleaseTimersRef.current = {};
    };
  }, [showOnScreenKeyboard]);

  useEffect(() => {
    if (!finished || isTextLoading || textLoadError || totalWords === 0) {
      return;
    }

    if (!user) {
      return;
    }

    const runKey = [
      user.id,
      activeText?.id ?? "none",
      mode,
      wordsCount,
      wordDifficulty,
      wordNoMistakeMode,
      typedChars,
      mistakes,
      completedWords,
      totalWords,
      durationMs
    ].join(":");

    if (savedRunKeyRef.current === runKey) {
      return;
    }

    savedRunKeyRef.current = runKey;
    setSaveState("saving");
    setSaveError("");

    const savedDifficulty = getSavedDifficulty(mode, wordDifficulty);

    void saveTypingRun({
      textId: activeText?.id ?? null,
      mode,
      language,
      difficulty: savedDifficulty,
      wordsCount: mode === "words" ? wordsCount : null,
      noMistakeMode: wordNoMistakeMode,
      wpm,
      accuracy,
      durationMs,
      typedChars,
      correctChars,
      mistakes,
      completedWords,
      totalWords,
      failedByMistake,
      errorEvents
    })
      .then(() => {
        setSaveState("saved");
      })
      .catch((error: unknown) => {
        savedRunKeyRef.current = "";
        setSaveState("error");
        setSaveError(error instanceof Error ? error.message : "Could not save this run.");
      });
  }, [
    accuracy,
    activeText?.id,
    completedWords,
    correctChars,
    durationMs,
    errorEvents,
    failedByMistake,
    finished,
    isTextLoading,
    language,
    mistakes,
    mode,
    textLoadError,
    totalWords,
    typedChars,
    user,
    wordDifficulty,
    wordNoMistakeMode,
    wordsCount,
    wpm
  ]);

  function handleRestart() {
    savedRunKeyRef.current = "";
    setSaveState("idle");
    setSaveError("");
    restart();
  }

  const errorSummary = useMemo(() => {
    const errorCountByWord = errorEvents.reduce<Record<string, number>>((acc, entry) => {
      const key = `Word ${entry.wordNumber}: ${entry.word}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      uniqueErrorWords: Object.keys(errorCountByWord).length,
      mostErrorWord: Object.entries(errorCountByWord).sort((a, b) => b[1] - a[1])[0]
    };
  }, [errorEvents]);
  const displayedSaveState = finished && !user ? "skipped" : saveState;

  return (
    <div
      style={{
        padding: "32px 16px 40px",
        fontFamily: "var(--typing-font)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px"
      }}
    >
      {!finished && (
        <section
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px"
          }}
        >
          {isTextLoading && (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                padding: "18px",
                width: "min(100%, 980px)"
              }}
            >
              {mode === "words"
                ? "Generating random words from database..."
                : "Loading text from database..."}
            </div>
          )}

          {!isTextLoading && textLoadError && (
            <div
              style={{
                border: "1px solid var(--danger-border)",
                borderRadius: "8px",
                backgroundColor: "var(--danger-bg)",
                padding: "18px",
                width: "min(100%, 980px)"
              }}
            >
              <div style={{ color: "var(--danger)", marginBottom: "10px" }}>{textLoadError}</div>
              <button
                type="button"
                onClick={() => void reloadText()}
                style={{ padding: "10px 16px", cursor: "pointer", borderRadius: "8px" }}
              >
                Retry
              </button>
            </div>
          )}

          {!isTextLoading && !textLoadError && (
            <div
              ref={typingAreaRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onClick={() => typingAreaRef.current?.focus()}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                padding: "18px",
                outline: "none",
                cursor: "text",
                display: "inline-block",
                width: "max-content",
                maxWidth: "min(100%, 980px)",
                verticalAlign: "top"
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  lineHeight: 1.8,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  columnGap: 0,
                  rowGap: "4px"
                }}
              >
                {words.map((word, wordIndex) => {
                  const hasTrailingSpace = wordIndex < words.length - 1;

                  if (wordIndex < currentWordIndex) {
                    return (
                      <Fragment key={wordIndex}>
                        <span
                        style={{
                          color: highlightCorrectWords ? "var(--text)" : "var(--success)",
                          backgroundColor: highlightCorrectWords ? correctMarkerBackground : "transparent",
                          borderRadius: 0,
                          padding: 0,
                          display: "inline-flex"
                        }}
                      >
                          {word}
                        </span>
                        {hasTrailingSpace && (
                          <span
                            aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          color: "transparent",
                          backgroundColor: highlightCorrectWords ? correctMarkerBackground : "transparent",
                          borderRadius: 0,
                          padding: 0
                        }}
                      >
                        {"\u00A0"}
                          </span>
                        )}
                      </Fragment>
                    );
                  }

                  if (wordIndex > currentWordIndex || finished) {
                    return (
                      <Fragment key={wordIndex}>
                        <span style={{ color: "var(--muted)", display: "inline-flex" }}>{word}</span>
                        {hasTrailingSpace && <span aria-hidden="true">{"\u00A0"}</span>}
                      </Fragment>
                    );
                  }

                  const cursorInWord = currentInput.length < word.length;
                  const firstMismatchIndex = highlightErrorFromPoint
                    ? getFirstMismatchIndex(currentInput, word)
                    : -1;

                  return (
                    <Fragment key={wordIndex}>
                      <span
                        style={{
                          alignItems: "center",
                          whiteSpace: "normal",
                          display: "inline-flex",
                          boxShadow: !cursorInWord && !finished ? "inset -2px 0 0 var(--text)" : "none"
                        }}
                      >
                        {word.split("").map((char, charIndex) => {
                        let color = "var(--muted)";
                        let backgroundColor = "transparent";
                        let borderRadius = 0;
                        let padding = 0;

                          if (charIndex < currentInput.length) {
                            const markedAsWrongFromMismatch =
                              firstMismatchIndex !== -1 && charIndex >= firstMismatchIndex;

                          if (markedAsWrongFromMismatch) {
                            color = "var(--danger)";
                            backgroundColor = errorMarkerBackground;
                          } else {
                            color = currentInput[charIndex] === char ? "var(--text)" : "var(--danger)";
                            if (highlightCorrectWords && currentInput[charIndex] === char) {
                              backgroundColor = correctMarkerBackground;
                            }
                          }
                        }

                          const showCursor = cursorInWord && charIndex === currentInput.length;

                          return (
                            <span
                              key={charIndex}
                              style={{
                                color,
                                backgroundColor,
                                borderRadius,
                                padding,
                                boxShadow: showCursor ? "inset 2px 0 0 var(--text)" : "none"
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </span>
                      {hasTrailingSpace && <span aria-hidden="true">{"\u00A0"}</span>}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}

          <div
            style={{
              width: "min(100%, 980px)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
              gap: "10px"
            }}
          >
            <MetricCard label="WPM" value={wpm} />
            <MetricCard label="CPM" value={cpm} />
            <MetricCard label="Accuracy" value={`${accuracy}%`} />
            <MetricCard label="Progress" value={`${currentWordIndex}/${totalWords}`} />
            <MetricCard label="Errors" value={mistakes} />
            <MetricCard label="Category" value={activeText?.category ?? "-"} compact />
            <MetricCard label="Difficulty" value={activeText?.difficulty ?? "-"} compact />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              type="button"
              onClick={handleRestart}
              style={{ padding: "10px 16px", cursor: "pointer", borderRadius: "8px" }}
            >
              Reset
            </button>
          </div>

          {showOnScreenKeyboard && !isTextLoading && !textLoadError && (
            <OnScreenKeyboard activeKeys={activeKeyboardKeys} />
          )}
        </section>
      )}

      {finished && (
        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            backgroundColor: "var(--surface)",
            padding: "18px",
            width: "min(100%, 980px)"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "28px" }}>Run Complete</h2>
          {noMistakeActive && failedByMistake && (
            <p style={{ marginTop: 0, marginBottom: "12px", color: "var(--danger)", fontWeight: 600 }}>
              No Mistake Mode: run ended after the first mistake.
            </p>
          )}
          {displayedSaveState !== "idle" && (
            <p
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: displayedSaveState === "error" ? "var(--danger)" : "var(--muted)",
                fontWeight: 600
              }}
            >
              {displayedSaveState === "saving" && "Saving run..."}
              {displayedSaveState === "saved" && "Run saved to your account."}
              {displayedSaveState === "skipped" && "Login to save this run to your stats."}
              {displayedSaveState === "error" && `Save failed: ${saveError}`}
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px"
            }}
          >
            <MetricCard label="WPM" value={wpm} />
            <MetricCard label="CPM" value={cpm} />
            <MetricCard label="Accuracy" value={`${accuracy}%`} />
            <MetricCard label="Duration" value={`${durationSeconds}s`} />
            <MetricCard label="Keystrokes" value={typedChars} />
            <MetricCard label="Correct Keystrokes" value={correctChars} />
            <MetricCard label="Errors" value={mistakes} />
          </div>

          <h3 style={{ marginBottom: "8px", marginTop: "18px" }}>Error Breakdown</h3>
          {errorEvents.length === 0 && <p style={{ marginTop: 0 }}>No errors in this run.</p>}

          {errorEvents.length > 0 && (
            <section
              style={{
                border: "1px solid var(--border-soft)",
                borderRadius: "10px",
                backgroundColor: "var(--surface-soft)",
                padding: "12px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "12px"
                }}
              >
                <span
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    backgroundColor: "var(--surface)"
                  }}
                >
                  Total Errors: {mistakes}
                </span>
                <span
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    backgroundColor: "var(--surface)"
                  }}
                >
                  Words Affected: {errorSummary.uniqueErrorWords}
                </span>
                {errorSummary.mostErrorWord && (
                  <span
                    style={{
                      border: "1px solid var(--border-soft)",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      backgroundColor: "var(--surface)"
                    }}
                  >
                    Most Errors: {errorSummary.mostErrorWord[0]} ({errorSummary.mostErrorWord[1]})
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                {errorEvents.map((entry) => {
                  const errorIndex = Math.min(
                    Math.max(entry.charPosition - 1, 0),
                    Math.max(entry.word.length - 1, 0)
                  );

                  return (
                    <article
                      key={entry.id}
                      style={{
                        border: "1px solid var(--border-soft)",
                        borderRadius: "8px",
                        backgroundColor: "var(--surface)",
                        padding: "10px"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginBottom: "8px"
                        }}
                      >
                        <strong style={{ fontSize: "14px" }}>
                          Word {entry.wordNumber} ({entry.word})
                        </strong>
                        <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                          Character {entry.charPosition}
                        </span>
                      </div>

                      <div
                        style={{
                          border: "1px dashed var(--border-soft)",
                          borderRadius: "8px",
                          backgroundColor: "var(--input-muted)",
                          padding: "10px"
                        }}
                      >
                        <div style={{ color: "var(--muted)", fontSize: "11px", marginBottom: "6px" }}>
                          Word Markup
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "flex-end", gap: "1px" }}>
                          {entry.word.split("").map((char, index) => {
                            if (index !== errorIndex) {
                              return (
                                <span key={index} style={{ color: "var(--muted-strong)", fontSize: "20px" }}>
                                  {char}
                                </span>
                              );
                            }

                            return (
                              <span
                                key={index}
                                style={{
                                  position: "relative",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  margin: "0 2px"
                                }}
                              >
                                <span
                                  style={{
                                    position: "absolute",
                                    top: "-18px",
                                    fontSize: "10px",
                                    color: "var(--danger)",
                                    backgroundColor: "var(--danger-bg)",
                                    border: "1px solid var(--danger-border)",
                                    borderRadius: "999px",
                                    padding: "1px 6px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  typed: {entry.typed}
                                </span>
                                <span
                                  style={{
                                    color: "var(--danger)",
                                    fontSize: "20px",
                                    backgroundColor: "var(--danger-bg)",
                                    border: "1px solid var(--danger-border)",
                                    borderRadius: "4px",
                                    padding: "0 4px",
                                    textDecoration: "underline"
                                  }}
                                >
                                  {char}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: "8px", color: "var(--muted)", fontSize: "12px" }}>
                          Expected: <strong>{entry.expected}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={handleRestart}
            style={{ padding: "10px 16px", cursor: "pointer", borderRadius: "8px" }}
          >
            Play Again
          </button>
        </section>
      )}
    </div>
  );
}
