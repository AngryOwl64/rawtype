// Main typing game view and run-completion screen.
// Connects the game hook, persistence, metrics, and word rendering.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../auth/authContext";
import { getTypingGameTexts } from "../../../i18n/messages";
import { saveTypingRun } from "../services/runResults";
import { useActiveKeyboardKeys } from "../hooks/useActiveKeyboardKeys";
import { useTypingGame } from "../hooks/useTypingGame";
import type { TypingLanguage, TypingMode, WordModeDifficulty, WordNoMistakeMode } from "../types";
import { getFirstMismatchIndex, getSavedDifficulty, hexToRgba } from "../utils/display";
import { MetricCard } from "./MetricCard";
import { OnScreenKeyboard } from "./OnScreenKeyboard";

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
  const text = useMemo(() => getTypingGameTexts(language), [language]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const activeKeyboardKeys = useActiveKeyboardKeys(showOnScreenKeyboard);
  const savedRunKeyRef = useRef("");
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
        setSaveError(error instanceof Error ? error.message : text.saveFailed);
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
    wpm,
    text.saveFailed
  ]);

  function handleRestart() {
    savedRunKeyRef.current = "";
    setSaveState("idle");
    setSaveError("");
    restart();
  }

  const errorSummary = useMemo(() => {
    const errorCountByWord = errorEvents.reduce<Record<string, number>>((acc, entry) => {
      const key = `${text.wordLabel} ${entry.wordNumber}: ${entry.word}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      uniqueErrorWords: Object.keys(errorCountByWord).length,
      mostErrorWord: Object.entries(errorCountByWord).sort((a, b) => b[1] - a[1])[0]
    };
  }, [errorEvents, text.wordLabel]);
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
                ? text.loadingWords
                : text.loadingText}
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
                {text.retry}
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
                          const borderRadius = 0;
                          const padding = 0;

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
            <MetricCard label={text.metricAccuracy} value={`${accuracy}%`} />
            <MetricCard label={text.metricProgress} value={`${currentWordIndex}/${totalWords}`} />
            <MetricCard label={text.metricErrors} value={mistakes} />
            <MetricCard label={text.metricCategory} value={activeText?.category ?? "-"} compact />
            <MetricCard label={text.metricDifficulty} value={activeText?.difficulty ?? "-"} compact />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              type="button"
              onClick={handleRestart}
              style={{ padding: "10px 16px", cursor: "pointer", borderRadius: "8px" }}
            >
              {text.reset}
            </button>
          </div>

          {showOnScreenKeyboard && !isTextLoading && !textLoadError && (
            <OnScreenKeyboard activeKeys={activeKeyboardKeys} title={text.onScreenKeyboard} />
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
          <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "28px" }}>{text.runComplete}</h2>
          {noMistakeActive && failedByMistake && (
            <p style={{ marginTop: 0, marginBottom: "12px", color: "var(--danger)", fontWeight: 600 }}>
              {text.noMistakeEnded}
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
              {displayedSaveState === "saving" && text.savingRun}
              {displayedSaveState === "saved" && text.runSaved}
              {displayedSaveState === "skipped" && text.loginToSave}
              {displayedSaveState === "error" && `${text.saveFailed}: ${saveError}`}
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
            <MetricCard label={text.metricAccuracy} value={`${accuracy}%`} />
            <MetricCard label={text.metricDuration} value={`${durationSeconds}s`} />
            <MetricCard label={text.metricKeystrokes} value={typedChars} />
            <MetricCard label={text.metricCorrectKeystrokes} value={correctChars} />
            <MetricCard label={text.metricErrors} value={mistakes} />
          </div>

          <h3 style={{ marginBottom: "8px", marginTop: "18px" }}>{text.errorBreakdown}</h3>
          {errorEvents.length === 0 && <p style={{ marginTop: 0 }}>{text.noErrors}</p>}

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
                  {text.totalErrors}: {mistakes}
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
                  {text.wordsAffected}: {errorSummary.uniqueErrorWords}
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
                    {text.mostErrors}: {errorSummary.mostErrorWord[0]} ({errorSummary.mostErrorWord[1]})
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
                          {text.wordLabel} {entry.wordNumber} ({entry.word})
                        </strong>
                        <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                          {text.characterLabel} {entry.charPosition}
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
                          {text.wordMarkup}
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
                                  {text.typedLabel}: {entry.typed}
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
                          {text.expectedLabel}: <strong>{entry.expected}</strong>
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
            {text.playAgain}
          </button>
        </section>
      )}
    </div>
  );
}
