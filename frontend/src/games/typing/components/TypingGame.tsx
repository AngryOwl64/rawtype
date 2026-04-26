// Main typing game view and run-completion screen.
// Connects the game hook, persistence, metrics, and word rendering.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../auth/authContext";
import { getTypingGameTexts } from "../../../i18n/messages";
import { saveTypingRun } from "../services/runResults";
import { useActiveKeyboardKeys } from "../hooks/useActiveKeyboardKeys";
import { useTypingGame } from "../hooks/useTypingGame";
import type {
  AnimationIntensity,
  CaretAnimationStyle,
  CaretMovementAnimation,
  CompletionAnimationStyle,
  ErrorFeedbackAnimation,
  KeyboardAnimationStyle,
  OnScreenKeyboardLayout,
  RestartKey,
  TypingFeedbackAnimation,
  TypingLanguage,
  TypingMode,
  WordModeDifficulty,
  WordNoMistakeMode
} from "../types";
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
  onScreenKeyboardLayout?: OnScreenKeyboardLayout;
  restartKey?: RestartKey;
  saveRunsToAccount?: boolean;
  saveErrorWords?: boolean;
  showErrorBreakdown?: boolean;
  correctMarkerColor?: string;
  errorMarkerColor?: string;
  animationIntensity?: AnimationIntensity;
  caretAnimationStyle?: CaretAnimationStyle;
  caretMovementAnimation?: CaretMovementAnimation;
  typingFeedbackAnimation?: TypingFeedbackAnimation;
  errorFeedbackAnimation?: ErrorFeedbackAnimation;
  keyboardAnimationStyle?: KeyboardAnimationStyle;
  completionAnimationStyle?: CompletionAnimationStyle;
};

type CaretBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function GlidingCaret({
  box,
  caretAnimationStyle,
  caretMovementAnimation
}: {
  box: CaretBox | null;
  caretAnimationStyle: CaretAnimationStyle;
  caretMovementAnimation: CaretMovementAnimation;
}) {
  if (!box) return null;

  return (
    <span
      aria-hidden="true"
      className={`rawtype-gliding-caret rawtype-caret-visual-${caretAnimationStyle} rawtype-cursor-movement-${caretMovementAnimation}`}
      style={{
        transform: `translate3d(${box.x}px, ${box.y}px, 0)`,
        width: `${box.width}px`,
        height: `${box.height}px`
      }}
    />
  );
}

function CompletionCelebration({
  animationIntensity,
  completionAnimationStyle
}: {
  animationIntensity: AnimationIntensity;
  completionAnimationStyle: CompletionAnimationStyle;
}) {
  if (animationIntensity === "off" || completionAnimationStyle === "none") {
    return null;
  }

  const particleCount = animationIntensity === "expressive" ? 30 : animationIntensity === "balanced" ? 22 : 14;

  return (
    <div
      aria-hidden="true"
      className={`rawtype-completion-celebration rawtype-motion-${animationIntensity} rawtype-completion-${completionAnimationStyle}`}
    >
      {Array.from({ length: particleCount }, (_, index) => (
        <span
          key={index}
          className="rawtype-completion-particle"
          style={{
            "--particle-index": index,
            "--particle-left": `${6 + ((index * 19) % 88)}%`,
            "--particle-hue": `${(index * 37) % 360}deg`,
            "--particle-delay": `${index * 34}ms`,
            "--particle-drift": `${(index % 7) - 3}`,
            "--particle-top": `${16 + (index % 7) * 10}%`,
            "--particle-drift-x": `${((index % 7) - 3) * 18}px`,
            "--particle-ribbon-x": `${260 + ((index % 7) - 3) * 28}px`,
            "--particle-tilt-start": `${((index % 7) - 3) * 5}deg`,
            "--particle-tilt-end": `${((index % 7) - 3) * -8}deg`,
            "--particle-angle": `${index * 24}deg`,
            "--particle-start-rotation": `${index * 17}deg`,
            "--particle-spin": `${index * 43}deg`,
            "--particle-radius": `${52 + index}px`,
            "--particle-scale": `${3 + index * 0.08}`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function TypingGame({
  mode = "sentences",
  language = "en",
  wordsCount = 25,
  wordDifficulty = "mixed",
  wordNoMistakeMode = "off",
  highlightCorrectWords = true,
  highlightErrorFromPoint = true,
  showOnScreenKeyboard = false,
  onScreenKeyboardLayout = "us-qwerty",
  restartKey = "Enter",
  saveRunsToAccount = true,
  saveErrorWords = true,
  showErrorBreakdown = true,
  correctMarkerColor = "#6fbf73",
  errorMarkerColor = "#c86b73",
  animationIntensity = "balanced",
  caretAnimationStyle = "blink",
  caretMovementAnimation = "slide",
  typingFeedbackAnimation = "lift",
  errorFeedbackAnimation = "shake",
  keyboardAnimationStyle = "press",
  completionAnimationStyle = "confetti"
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
  const caretTargetRef = useRef<HTMLSpanElement | null>(null);
  const [caretBox, setCaretBox] = useState<CaretBox | null>(null);

  const measureCaret = useCallback(() => {
    const typingArea = typingAreaRef.current;
    const caretTarget = caretTargetRef.current;

    if (!typingArea || !caretTarget || finished || isTextLoading || textLoadError) {
      setCaretBox(null);
      return;
    }

    const stageRect = typingArea.getBoundingClientRect();
    const targetRect = caretTarget.getBoundingClientRect();
    const placement = caretTarget.dataset.caretPlacement;
    const nextBox = {
      x:
        (placement === "after" ? targetRect.right - stageRect.left : targetRect.left - stageRect.left) -
        typingArea.clientLeft,
      y: targetRect.top - stageRect.top - typingArea.clientTop,
      width: Math.max(2, targetRect.width),
      height: targetRect.height
    };

    setCaretBox((previousBox) => {
      if (
        previousBox &&
        Math.abs(previousBox.x - nextBox.x) < 0.4 &&
        Math.abs(previousBox.y - nextBox.y) < 0.4 &&
        Math.abs(previousBox.width - nextBox.width) < 0.4 &&
        Math.abs(previousBox.height - nextBox.height) < 0.4
      ) {
        return previousBox;
      }

      return nextBox;
    });
  }, [finished, isTextLoading, textLoadError]);

  useEffect(() => {
    void reloadText();
  }, [reloadText]);

  useLayoutEffect(() => {
    measureCaret();
  }, [currentInput, currentWordIndex, measureCaret, words]);

  useEffect(() => {
    const typingArea = typingAreaRef.current;
    if (!typingArea) return;

    window.addEventListener("resize", measureCaret);

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => measureCaret());
      resizeObserver.observe(typingArea);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", measureCaret);
      };
    }

    return () => window.removeEventListener("resize", measureCaret);
  }, [measureCaret]);

  useEffect(() => {
    if (!finished && !isTextLoading && !textLoadError) {
      typingAreaRef.current?.focus();
    }
  }, [finished, isTextLoading, textLoadError]);

  useEffect(() => {
    if (!finished || isTextLoading || textLoadError || totalWords === 0) {
      return;
    }

    if (!user || !saveRunsToAccount) {
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
      errorEvents,
      saveErrorWords
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
    saveErrorWords,
    saveRunsToAccount,
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

  const handleRestart = useCallback(() => {
    savedRunKeyRef.current = "";
    setSaveState("idle");
    setSaveError("");
    restart();
  }, [restart]);

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
  const displayedSaveState = finished && (!user || !saveRunsToAccount) ? "skipped" : saveState;
  const restartKeyLabel = restartKey === "Enter" ? "Return" : "Escape";

  useEffect(() => {
    if (isTextLoading || textLoadError) {
      return;
    }

    function handleRestartKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target;
      const targetElement = target instanceof HTMLElement ? target : null;
      const isEditing =
        targetElement?.tagName === "INPUT" ||
        targetElement?.tagName === "SELECT" ||
        targetElement?.tagName === "TEXTAREA" ||
        targetElement?.isContentEditable;

      if (isEditing || event.metaKey || event.ctrlKey || event.altKey || event.repeat || event.key !== restartKey) {
        return;
      }

      event.preventDefault();
      handleRestart();
    }

    window.addEventListener("keydown", handleRestartKeyDown);
    return () => window.removeEventListener("keydown", handleRestartKeyDown);
  }, [handleRestart, isTextLoading, restartKey, textLoadError]);

  return (
    <div
      className={`rawtype-typing-game rawtype-motion-${animationIntensity}`}
      style={{
        padding: "32px 16px 40px",
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
              className="rawtype-typing-stage"
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
                  fontFamily: "var(--typing-font)",
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
                      <span
                        key={wordIndex}
                        style={{
                          display: "inline-flex",
                          backgroundColor: highlightCorrectWords ? correctMarkerBackground : "transparent",
                          borderRadius: 0
                        }}
                      >
                        <span
                          className={`rawtype-completed-word rawtype-feedback-${typingFeedbackAnimation}`}
                          style={{
                            color: highlightCorrectWords ? "var(--text)" : "var(--success)",
                            backgroundColor: "transparent",
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
                              backgroundColor: "transparent",
                              borderRadius: 0,
                              padding: 0
                            }}
                          >
                            {"\u00A0"}
                          </span>
                        )}
                      </span>
                    );
                  }

                  if (wordIndex > currentWordIndex || finished) {
                    return (
                      <span key={wordIndex} style={{ display: "inline-flex" }}>
                        <span style={{ color: "var(--muted)", display: "inline-flex" }}>{word}</span>
                        {hasTrailingSpace && <span aria-hidden="true">{"\u00A0"}</span>}
                      </span>
                    );
                  }

                  const cursorInWord = currentInput.length < word.length;
                  const firstMismatchIndex = highlightErrorFromPoint
                    ? getFirstMismatchIndex(currentInput, word)
                    : -1;
                  const showSpaceCursor = !cursorInWord && !finished && hasTrailingSpace;
                  const showEndCursor = !cursorInWord && !finished && !hasTrailingSpace;

                  return (
                    <span key={wordIndex} style={{ display: "inline-flex" }}>
                      <span
                        className="rawtype-current-word"
                        style={{
                          alignItems: "center",
                          whiteSpace: "normal",
                          display: "inline-flex"
                        }}
                      >
                        {word.split("").map((char, charIndex) => {
                          let color = "var(--muted)";
                          let backgroundColor = "transparent";
                          const borderRadius = 0;
                          const padding = 0;
                          let characterStateClass = "";

                          if (charIndex < currentInput.length) {
                            const markedAsWrongFromMismatch =
                              firstMismatchIndex !== -1 && charIndex >= firstMismatchIndex;

                            if (markedAsWrongFromMismatch) {
                              color = "var(--danger)";
                              backgroundColor = errorMarkerBackground;
                              characterStateClass = "rawtype-char-error";
                            } else {
                              const typedCorrectly = currentInput[charIndex] === char;
                              color = typedCorrectly ? "var(--text)" : "var(--danger)";
                              characterStateClass = typedCorrectly ? "rawtype-char-correct" : "rawtype-char-error";

                              if (highlightCorrectWords && typedCorrectly) {
                                backgroundColor = correctMarkerBackground;
                              }
                            }
                          }

                          const showCaretBeforeChar = cursorInWord && charIndex === currentInput.length;
                          const showCaretAfterChar = showEndCursor && charIndex === word.length - 1;
                          const isCaretTarget = showCaretBeforeChar || showCaretAfterChar;
                          const characterClassName = [
                            "rawtype-typing-char",
                            characterStateClass,
                            characterStateClass === "rawtype-char-correct"
                              ? `rawtype-feedback-${typingFeedbackAnimation}`
                              : "",
                            characterStateClass === "rawtype-char-error"
                              ? `rawtype-error-${errorFeedbackAnimation}`
                              : ""
                          ]
                            .filter(Boolean)
                            .join(" ");

                          return (
                            <span
                              key={charIndex}
                              ref={isCaretTarget ? caretTargetRef : undefined}
                              className={characterClassName}
                              data-caret-placement={showCaretAfterChar ? "after" : "before"}
                              style={{
                                color,
                                backgroundColor,
                                borderRadius,
                                padding,
                                animationDelay:
                                  characterStateClass === "rawtype-char-correct" && typingFeedbackAnimation === "wave"
                                    ? `${charIndex * 20}ms`
                                    : undefined
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </span>
                      {hasTrailingSpace && (
                        <span
                          aria-hidden="true"
                          ref={showSpaceCursor ? caretTargetRef : undefined}
                          data-caret-placement={showSpaceCursor ? "before" : undefined}
                          style={{ display: "inline-flex" }}
                        >
                          {"\u00A0"}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
              <GlidingCaret
                box={caretBox}
                caretAnimationStyle={caretAnimationStyle}
                caretMovementAnimation={caretMovementAnimation}
              />
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
            <OnScreenKeyboard
              activeKeys={activeKeyboardKeys}
              title={text.onScreenKeyboard}
              layout={onScreenKeyboardLayout}
              animationIntensity={animationIntensity}
              keyboardAnimationStyle={keyboardAnimationStyle}
            />
          )}
        </section>
      )}

      {finished && (
        <section
          className="rawtype-finished-panel"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            backgroundColor: "var(--surface)",
            padding: "18px",
            width: "min(100%, 980px)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <CompletionCelebration
            animationIntensity={animationIntensity}
            completionAnimationStyle={completionAnimationStyle}
          />
          <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "28px" }}>{text.runComplete}</h2>
          <p style={{ marginTop: 0, marginBottom: "12px", color: "var(--muted)", fontWeight: 600 }}>
            {text.restartHint.replace("{key}", restartKeyLabel)}
          </p>
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
              {displayedSaveState === "skipped" && (user ? text.saveDisabled : text.loginToSave)}
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

          {showErrorBreakdown && (
            <>
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
            </>
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
