import { useEffect, useRef } from "react";
import { useTypingGame } from "../hooks/useTypingGame";
import type { TypingMode, WordModeDifficulty, WordNoMistakeMode } from "../types";

type TypingGameProps = {
  mode?: TypingMode;
  wordsCount?: number;
  wordDifficulty?: WordModeDifficulty;
  wordNoMistakeMode?: WordNoMistakeMode;
};

export default function TypingGame({
  mode = "sentences",
  wordsCount = 25,
  wordDifficulty = "mixed",
  wordNoMistakeMode = "off"
}: TypingGameProps) {
  const {
    activeText,
    words,
    currentWordIndex,
    currentInput,
    finished,
    isTextLoading,
    textLoadError,
    wpm,
    accuracy,
    typedChars,
    correctChars,
    mistakes,
    completedWords,
    totalWords,
    durationSeconds,
    errorEvents,
    failedByMistake,
    noMistakeActive,
    restart,
    reloadText,
    handleKeyDown
  } = useTypingGame({ mode, wordsCount, wordDifficulty, wordNoMistakeMode, language: "en" });
  const typingAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void reloadText();
  }, [reloadText]);

  useEffect(() => {
    if (!finished && !isTextLoading && !textLoadError) {
      typingAreaRef.current?.focus();
    }
  }, [finished, isTextLoading, textLoadError]);

  function handleRestart() {
    restart();
  }

  const errorCountByWord = errorEvents.reduce<Record<string, number>>((acc, entry) => {
    const key = `Word ${entry.wordNumber}: ${entry.word}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const uniqueErrorWords = Object.keys(errorCountByWord).length;
  const mostErrorWord = Object.entries(errorCountByWord).sort((a, b) => b[1] - a[1])[0];

  return (
    <div
      style={{
        padding: "32px 16px 40px",
        fontFamily: "Consolas, Menlo, Monaco, monospace",
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
                border: "1px solid #c9d5e5",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
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
                border: "1px solid #f0d7dc",
                borderRadius: "8px",
                backgroundColor: "#fff3f5",
                padding: "18px",
                width: "min(100%, 980px)"
              }}
            >
              <div style={{ color: "#9f3e4d", marginBottom: "10px" }}>{textLoadError}</div>
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
                border: "1px solid #c9d5e5",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
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
                      <span key={wordIndex} style={{ color: "#4caf50", display: "inline-flex" }}>
                        {word}
                      </span>
                    );
                  }

                  if (wordIndex > currentWordIndex || finished) {
                    return (
                      <span key={wordIndex} style={{ color: "#8a8a8a", display: "inline-flex" }}>
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
                        boxShadow: !cursorInWord && !finished ? "inset -2px 0 0 #1c2736" : "none"
                      }}
                    >
                      {word.split("").map((char, charIndex) => {
                        let color = "#8a8a8a";

                        if (charIndex < currentInput.length) {
                          color = currentInput[charIndex] === char ? "#4caf50" : "#f44336";
                        }

                        const showCursor = cursorInWord && charIndex === currentInput.length;

                        return (
                          <span
                            key={charIndex}
                            style={{
                              color,
                              boxShadow: showCursor ? "inset 2px 0 0 #1c2736" : "none"
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
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px"
            }}
          >
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>WPM</div>
              <strong style={{ fontSize: "22px" }}>{wpm}</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Accuracy</div>
              <strong style={{ fontSize: "22px" }}>{accuracy}%</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Progress</div>
              <strong style={{ fontSize: "22px" }}>
                {currentWordIndex}/{totalWords}
              </strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Errors</div>
              <strong style={{ fontSize: "22px" }}>{mistakes}</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Category</div>
              <strong style={{ fontSize: "16px" }}>{activeText?.category ?? "-"}</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Difficulty</div>
              <strong style={{ fontSize: "16px" }}>{activeText?.difficulty ?? "-"}</strong>
            </div>
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
            border: "1px solid #c9d5e5",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            padding: "18px",
            width: "min(100%, 980px)"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "28px" }}>Run Complete</h2>
          {noMistakeActive && failedByMistake && (
            <p style={{ marginTop: 0, marginBottom: "12px", color: "#9f3e4d", fontWeight: 600 }}>
              No Mistake Mode: run ended after the first mistake.
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px"
            }}
          >
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>WPM</div>
              <strong style={{ fontSize: "22px" }}>{wpm}</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Accuracy</div>
              <strong style={{ fontSize: "22px" }}>{accuracy}%</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Duration</div>
              <strong style={{ fontSize: "22px" }}>{durationSeconds}s</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>
                Words Completed
              </div>
              <strong style={{ fontSize: "22px" }}>
                {completedWords}/{totalWords}
              </strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Keystrokes</div>
              <strong style={{ fontSize: "22px" }}>{typedChars}</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>
                Correct Keystrokes
              </div>
              <strong style={{ fontSize: "22px" }}>{correctChars}</strong>
            </div>
            <div style={{ border: "1px solid #e1e7f0", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#5a6b80", fontSize: "12px", marginBottom: "4px" }}>Errors</div>
              <strong style={{ fontSize: "22px" }}>{mistakes}</strong>
            </div>
          </div>

          <h3 style={{ marginBottom: "8px", marginTop: "18px" }}>Error Breakdown</h3>
          {errorEvents.length === 0 && <p style={{ marginTop: 0 }}>No errors in this run.</p>}

          {errorEvents.length > 0 && (
            <section
              style={{
                border: "1px solid #e1e7f0",
                borderRadius: "10px",
                backgroundColor: "#fbfcff",
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
                    border: "1px solid #d7dfeb",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    backgroundColor: "#ffffff"
                  }}
                >
                  Total Errors: {mistakes}
                </span>
                <span
                  style={{
                    border: "1px solid #d7dfeb",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    backgroundColor: "#ffffff"
                  }}
                >
                  Words Affected: {uniqueErrorWords}
                </span>
                {mostErrorWord && (
                  <span
                    style={{
                      border: "1px solid #d7dfeb",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      backgroundColor: "#ffffff"
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
                        border: "1px solid #e2e8f2",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
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
                        <span style={{ color: "#5a6b80", fontSize: "12px" }}>
                          Character {entry.charPosition}
                        </span>
                      </div>

                      <div
                        style={{
                          border: "1px dashed #d7dfeb",
                          borderRadius: "8px",
                          backgroundColor: "#f8faff",
                          padding: "10px"
                        }}
                      >
                        <div style={{ color: "#5a6b80", fontSize: "11px", marginBottom: "6px" }}>
                          Word Markup
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "flex-end", gap: "1px" }}>
                          {entry.word.split("").map((char, index) => {
                            if (index !== errorIndex) {
                              return (
                                <span key={index} style={{ color: "#2d3a4d", fontSize: "20px" }}>
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
                                    color: "#9f3e4d",
                                    backgroundColor: "#fff3f5",
                                    border: "1px solid #f0d7dc",
                                    borderRadius: "999px",
                                    padding: "1px 6px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  typed: {entry.typed}
                                </span>
                                <span
                                  style={{
                                    color: "#9f3e4d",
                                    fontSize: "20px",
                                    backgroundColor: "#ffe7ec",
                                    border: "1px solid #f0d7dc",
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
                        <div style={{ marginTop: "8px", color: "#5a6b80", fontSize: "12px" }}>
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
