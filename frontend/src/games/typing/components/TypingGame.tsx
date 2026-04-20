import { useEffect, useRef, useState } from "react";
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
};

function getSavedDifficulty(mode: TypingMode, wordDifficulty: WordModeDifficulty): WordModeDifficulty | null {
  if (mode === "words") return wordDifficulty;
  return null;
}

function MetricCard({
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
}

export default function TypingGame({
  mode = "sentences",
  language = "en",
  wordsCount = 25,
  wordDifficulty = "mixed",
  wordNoMistakeMode = "off"
}: TypingGameProps) {
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const savedRunKeyRef = useRef("");
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

  const errorCountByWord = errorEvents.reduce<Record<string, number>>((acc, entry) => {
    const key = `Word ${entry.wordNumber}: ${entry.word}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const uniqueErrorWords = Object.keys(errorCountByWord).length;
  const mostErrorWord = Object.entries(errorCountByWord).sort((a, b) => b[1] - a[1])[0];
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
                  columnGap: "8px",
                  rowGap: "4px"
                }}
              >
                {words.map((word, wordIndex) => {
                  if (wordIndex < currentWordIndex) {
                    return (
                      <span key={wordIndex} style={{ color: "var(--success)", display: "inline-flex" }}>
                        {word}
                      </span>
                    );
                  }

                  if (wordIndex > currentWordIndex || finished) {
                    return (
                      <span key={wordIndex} style={{ color: "var(--muted)", display: "inline-flex" }}>
                        {word}
                      </span>
                    );
                  }

                  const cursorInWord = currentInput.length < word.length;

                  return (
                    <span
                      key={wordIndex}
                      style={{
                        alignItems: "center",
                        whiteSpace: "normal",
                        display: "inline-flex",
                        boxShadow: !cursorInWord && !finished ? "inset -2px 0 0 var(--text)" : "none"
                      }}
                    >
                      {word.split("").map((char, charIndex) => {
                        let color = "var(--muted)";

                        if (charIndex < currentInput.length) {
                          color = currentInput[charIndex] === char ? "var(--success)" : "var(--danger)";
                        }

                        const showCursor = cursorInWord && charIndex === currentInput.length;

                        return (
                          <span
                            key={charIndex}
                            style={{
                              color,
                              boxShadow: showCursor ? "inset 2px 0 0 var(--text)" : "none"
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
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
            <MetricCard label="Words Completed" value={`${completedWords}/${totalWords}`} />
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
                  Words Affected: {uniqueErrorWords}
                </span>
                {mostErrorWord && (
                  <span
                    style={{
                      border: "1px solid var(--border-soft)",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      backgroundColor: "var(--surface)"
                    }}
                  >
                    Most Errors: {mostErrorWord[0]} ({mostErrorWord[1]})
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
