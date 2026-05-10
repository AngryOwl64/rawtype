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
  CustomTypingSettings,
  ErrorFeedbackAnimation,
  FocusMode,
  KeyboardAnimationStyle,
  MetricValueAnimationStyle,
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
  gameLanguage?: TypingLanguage;
  wordsCount?: number;
  wordDifficulty?: WordModeDifficulty;
  wordNoMistakeMode?: WordNoMistakeMode;
  customSettings?: CustomTypingSettings;
  highlightCorrectWords?: boolean;
  highlightErrorFromPoint?: boolean;
  showOnScreenKeyboard?: boolean;
  onScreenKeyboardLayout?: OnScreenKeyboardLayout;
  restartKey?: RestartKey;
  focusMode?: FocusMode;
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
  metricValueAnimationStyle?: MetricValueAnimationStyle;
};

type CaretBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function getCaretAnchorOffset(placement: string | undefined, targetWidth: number): number {
  if (placement === "after") return targetWidth;
  if (placement === "inside-start") return Math.min(3, Math.max(1, targetWidth * 0.14));
  return 0;
}

const COLUMN_MAX_CHARS_PER_ROW = 70;

type ColumnFocusRow = {
  startWordIndex: number;
  endWordIndex: number;
  words: Array<{ word: string; wordIndex: number }>;
};

function buildColumnFocusRows(words: string[]): ColumnFocusRow[] {
  const rows: ColumnFocusRow[] = [];
  let cursor = 0;

  while (cursor < words.length) {
    const startWordIndex = cursor;
    let currentRowChars = 0;
    const rowWords: Array<{ word: string; wordIndex: number }> = [];

    while (cursor < words.length) {
      const nextWord = words[cursor];
      const separatorChars = rowWords.length > 0 ? 1 : 0;
      const nextWordChars = nextWord.length + separatorChars;

      if (rowWords.length > 0 && currentRowChars + nextWordChars > COLUMN_MAX_CHARS_PER_ROW) {
        break;
      }

      rowWords.push({ word: nextWord, wordIndex: cursor });
      currentRowChars += nextWordChars;
      cursor += 1;
    }

    if (rowWords.length === 0) {
      rowWords.push({ word: words[cursor], wordIndex: cursor });
      cursor += 1;
    }

    rows.push({
      startWordIndex,
      endWordIndex: cursor,
      words: rowWords
    });
  }

  return rows;
}

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
  gameLanguage = language,
  wordsCount = 25,
  wordDifficulty = "mixed",
  wordNoMistakeMode = "off",
  customSettings,
  highlightCorrectWords = true,
  highlightErrorFromPoint = true,
  showOnScreenKeyboard = false,
  onScreenKeyboardLayout = "us-qwerty",
  restartKey = "Enter",
  focusMode = "all",
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
  completionAnimationStyle = "confetti",
  metricValueAnimationStyle = "none"
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
  } = useTypingGame({
    mode,
    wordsCount,
    wordDifficulty,
    wordNoMistakeMode,
    customSettings,
    language: gameLanguage,
    uiLanguage: language
  });
  const typingAreaRef = useRef<HTMLDivElement | null>(null);
  const caretTargetRef = useRef<HTMLSpanElement | null>(null);
  const [caretBox, setCaretBox] = useState<CaretBox | null>(null);
  const [oneLineEdgePadding, setOneLineEdgePadding] = useState(0);
  const [forceInstantCaretMovement, setForceInstantCaretMovement] = useState(false);
  const instantCaretFrameRef = useRef<number | null>(null);
  const wasAtRunStartRef = useRef(false);

  const triggerInstantCaretMovement = useCallback(() => {
    if (instantCaretFrameRef.current !== null) {
      window.cancelAnimationFrame(instantCaretFrameRef.current);
      instantCaretFrameRef.current = null;
    }

    setForceInstantCaretMovement(true);
    instantCaretFrameRef.current = window.requestAnimationFrame(() => {
      instantCaretFrameRef.current = window.requestAnimationFrame(() => {
        setForceInstantCaretMovement(false);
        instantCaretFrameRef.current = null;
      });
    });
  }, []);

  const syncOneLineEdgePadding = useCallback(() => {
    const typingArea = typingAreaRef.current;
    if (!typingArea || focusMode !== "onelinemode") {
      setOneLineEdgePadding((previousPadding) => (previousPadding === 0 ? previousPadding : 0));
      return;
    }

    const nextPadding = Math.max(0, typingArea.clientWidth / 2);
    setOneLineEdgePadding((previousPadding) =>
      Math.abs(previousPadding - nextPadding) < 0.5 ? previousPadding : nextPadding
    );
  }, [focusMode]);

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
    const anchorOffset = getCaretAnchorOffset(placement, targetRect.width);
    const targetContentX =
      targetRect.left - stageRect.left - typingArea.clientLeft + typingArea.scrollLeft + anchorOffset;
    const targetContentY = targetRect.top - stageRect.top - typingArea.clientTop + typingArea.scrollTop;
    const nextBox = {
      x: targetContentX,
      y: targetContentY,
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

  const centerOneLineCursor = useCallback(() => {
    if (focusMode !== "onelinemode") return;

    const typingArea = typingAreaRef.current;
    const caretTarget = caretTargetRef.current;
    if (!typingArea || !caretTarget || finished || isTextLoading || textLoadError) {
      return;
    }

    const stageRect = typingArea.getBoundingClientRect();
    const targetRect = caretTarget.getBoundingClientRect();
    const placement = caretTarget.dataset.caretPlacement;
    const anchorOffset = getCaretAnchorOffset(placement, targetRect.width);
    const targetContentX =
      targetRect.left - stageRect.left - typingArea.clientLeft + typingArea.scrollLeft + anchorOffset;
    const desiredScrollLeft = targetContentX - typingArea.clientWidth / 2;
    const maxScrollLeft = Math.max(0, typingArea.scrollWidth - typingArea.clientWidth);
    const nextScrollLeft = Math.min(Math.max(0, desiredScrollLeft), maxScrollLeft);

    if (Math.abs(nextScrollLeft - typingArea.scrollLeft) > 0.5) {
      typingArea.scrollLeft = nextScrollLeft;
    }
  }, [finished, focusMode, isTextLoading, textLoadError]);

  useEffect(() => {
    void reloadText();
  }, [reloadText]);

  useEffect(() => {
    const isAtRunStart =
      !finished && !isTextLoading && !textLoadError && currentWordIndex === 0 && currentInput.length === 0;

    if (isAtRunStart && !wasAtRunStartRef.current) {
      triggerInstantCaretMovement();
    }

    wasAtRunStartRef.current = isAtRunStart;
  }, [currentInput, currentWordIndex, finished, isTextLoading, textLoadError, triggerInstantCaretMovement, words]);

  useEffect(() => {
    return () => {
      if (instantCaretFrameRef.current !== null) {
        window.cancelAnimationFrame(instantCaretFrameRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (focusMode === "onelinemode") {
      syncOneLineEdgePadding();
      centerOneLineCursor();
    }
    measureCaret();
  }, [
    centerOneLineCursor,
    currentInput,
    currentWordIndex,
    focusMode,
    measureCaret,
    oneLineEdgePadding,
    syncOneLineEdgePadding,
    words
  ]);

  useEffect(() => {
    const typingArea = typingAreaRef.current;
    if (!typingArea) return;

    const handleResize = () => {
      syncOneLineEdgePadding();
      centerOneLineCursor();
      measureCaret();
    };

    window.addEventListener("resize", handleResize);

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        syncOneLineEdgePadding();
        centerOneLineCursor();
        measureCaret();
      });
      resizeObserver.observe(typingArea);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
      };
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [centerOneLineCursor, measureCaret, syncOneLineEdgePadding]);

  useEffect(() => {
    const typingArea = typingAreaRef.current;
    if (!typingArea || focusMode !== "columns") return;

    function handleColumnMotionEvent(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest(".rawtype-focus-column-row")) return;
      measureCaret();
    }

    typingArea.addEventListener("animationstart", handleColumnMotionEvent, true);
    typingArea.addEventListener("animationend", handleColumnMotionEvent, true);
    typingArea.addEventListener("animationcancel", handleColumnMotionEvent, true);

    return () => {
      typingArea.removeEventListener("animationstart", handleColumnMotionEvent, true);
      typingArea.removeEventListener("animationend", handleColumnMotionEvent, true);
      typingArea.removeEventListener("animationcancel", handleColumnMotionEvent, true);
    };
  }, [focusMode, measureCaret]);

  useEffect(() => {
    if (focusMode !== "columns") return;

    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = window.requestAnimationFrame(() => {
      measureCaret();
      secondFrame = window.requestAnimationFrame(() => {
        measureCaret();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [currentInput, currentWordIndex, focusMode, measureCaret]);

  useEffect(() => {
    if (focusMode !== "onelinemode") return;

    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = window.requestAnimationFrame(() => {
      centerOneLineCursor();
      measureCaret();
      secondFrame = window.requestAnimationFrame(() => {
        centerOneLineCursor();
        measureCaret();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [centerOneLineCursor, currentInput, currentWordIndex, focusMode, measureCaret, words]);

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
      gameLanguage,
      wordsCount,
      wordDifficulty,
      wordNoMistakeMode,
      typedChars,
      correctChars,
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

    const savedDifficulty = mode === "custom" ? null : getSavedDifficulty(mode, wordDifficulty);

    void saveTypingRun({
      textId: activeText?.id ?? null,
      mode,
      language: activeText?.language ?? gameLanguage,
      difficulty: savedDifficulty,
      wordsCount: mode === "words" || mode === "custom" ? totalWords : null,
      noMistakeMode: mode === "words" ? wordNoMistakeMode : "off",
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
    activeText?.language,
    completedWords,
    correctChars,
    customSettings,
    durationMs,
    errorEvents,
    failedByMistake,
    finished,
    gameLanguage,
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
    triggerInstantCaretMovement();
    restart();
  }, [restart, triggerInstantCaretMovement]);

  const effectiveCaretMovementAnimation: CaretMovementAnimation = forceInstantCaretMovement
    ? "instant"
    : caretMovementAnimation;

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

  const columnFocusRows = useMemo(() => {
    if (focusMode !== "columns") return [];
    return buildColumnFocusRows(words);
  }, [focusMode, words]);

  const activeColumnRowIndex = useMemo(() => {
    if (focusMode !== "columns" || columnFocusRows.length === 0) return -1;

    const foundRowIndex = columnFocusRows.findIndex(
      (row) => currentWordIndex >= row.startWordIndex && currentWordIndex < row.endWordIndex
    );

    return foundRowIndex === -1 ? columnFocusRows.length - 1 : foundRowIndex;
  }, [columnFocusRows, currentWordIndex, focusMode]);

  const visibleColumnRows = useMemo(() => {
    if (focusMode !== "columns" || activeColumnRowIndex < 0) return [];

    const startIndex = Math.max(0, activeColumnRowIndex - 1);
    const endIndex = Math.min(columnFocusRows.length, activeColumnRowIndex + 2);

    return columnFocusRows.slice(startIndex, endIndex).map((row, rowOffset) => {
      const rowIndex = startIndex + rowOffset;
      return {
        ...row,
        rowIndex,
        focusDistance: rowIndex - activeColumnRowIndex
      };
    });
  }, [activeColumnRowIndex, columnFocusRows, focusMode]);

  const visibleWordEntries = useMemo(() => {
    if (focusMode === "all") {
      return words.map((word, wordIndex) => ({
        word,
        wordIndex,
        focusDistance: null
      }));
    }

    if (focusMode === "onelinemode") {
      return words.map((word, wordIndex) => ({
        word,
        wordIndex,
        focusDistance: Math.abs(wordIndex - currentWordIndex)
      }));
    }

    return words.slice(currentWordIndex, currentWordIndex + 3).map((word, focusDistance) => ({
      word,
      wordIndex: currentWordIndex + focusDistance,
      focusDistance
    }));
  }, [currentWordIndex, focusMode, words]);

  const wordListStyle: React.CSSProperties =
    focusMode === "all"
      ? {
          fontFamily: "var(--typing-font)",
          fontSize: "24px",
          lineHeight: 1.8,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          columnGap: 0,
          rowGap: "4px"
        }
      : focusMode === "columns"
        ? {
            fontFamily: "var(--typing-font)",
            fontSize: "24px",
            lineHeight: 1.55,
            display: "grid",
            gridTemplateColumns: "1fr",
            gridTemplateRows: `repeat(${Math.max(1, visibleColumnRows.length)}, minmax(42px, auto))`,
            gap: "10px",
            alignItems: "center",
            justifyItems: "stretch"
          }
        : focusMode === "onelinemode"
          ? {
              fontFamily: "var(--typing-font)",
              fontSize: "24px",
              lineHeight: 1.55,
              display: "inline-flex",
              flexWrap: "nowrap",
              alignItems: "flex-end",
              whiteSpace: "nowrap",
              gap: 0,
              minWidth: "max-content",
              paddingLeft: `${oneLineEdgePadding}px`,
              paddingRight: `${oneLineEdgePadding}px`
            }
        : {
          fontFamily: "var(--typing-font)",
          fontSize: "24px",
          lineHeight: 1.55,
          display: "grid",
          gridTemplateColumns: "repeat(3, max-content)",
          gap: "0 28px",
          alignItems: "center",
          justifyItems: "start"
        };

  function getFocusOpacity(focusDistance: number | null): number {
    if (focusDistance === null || focusDistance === 0) return 1;
    if (focusMode === "columns") return 0.72;
    return Math.max(0.38, 0.72 - Math.max(0, focusDistance) * 0.17);
  }

  function renderTypingWord(
    itemKey: string,
    word: string,
    wordIndex: number,
    focusDistance: number | null
  ) {
    const hasTrailingSpace = wordIndex < words.length - 1;
    const renderSpace = (spaceKey: string, withCaretAnchor: boolean) => {
      if (!hasTrailingSpace) return null;
      return (
        <span
          key={spaceKey}
          aria-hidden="true"
          ref={withCaretAnchor ? caretTargetRef : undefined}
          data-caret-placement={withCaretAnchor ? "before" : undefined}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {" "}
        </span>
      );
    };
    const focusStyle: React.CSSProperties =
      focusMode === "all"
        ? {}
        : {
            display: "inline-flex",
            minWidth: 0,
            opacity: getFocusOpacity(focusDistance),
            transition: "opacity var(--motion-medium) ease, transform var(--motion-medium) ease"
          };

    if (wordIndex < currentWordIndex) {
      return (
        <span
          key={itemKey}
          style={{
            display: "inline-flex",
            backgroundColor: highlightCorrectWords ? correctMarkerBackground : "transparent",
            borderRadius: 0,
            ...focusStyle
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
          {renderSpace(`${itemKey}-space`, false)}
        </span>
      );
    }

    if (wordIndex > currentWordIndex || finished) {
      return (
        <span key={itemKey} style={{ display: "inline-flex", ...focusStyle }}>
          <span style={{ color: "var(--muted)", display: "inline-flex" }}>{word}</span>
          {renderSpace(`${itemKey}-space`, false)}
        </span>
      );
    }

    const cursorInWord = currentInput.length < word.length;
    const firstMismatchIndex = highlightErrorFromPoint ? getFirstMismatchIndex(currentInput, word) : -1;
    const showSpaceCursor = !cursorInWord && !finished && hasTrailingSpace;
    const showEndCursor = !cursorInWord && !finished && !hasTrailingSpace;

    return (
      <span key={itemKey} style={{ display: "inline-flex", ...focusStyle }}>
        <span
          className="rawtype-current-word"
          style={{
            alignItems: "center",
            whiteSpace: "nowrap",
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
              const markedAsWrongFromMismatch = firstMismatchIndex !== -1 && charIndex >= firstMismatchIndex;

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
            const isInitialCaretAtFirstChar = showCaretBeforeChar && charIndex === 0 && currentInput.length === 0;
            const characterClassName = [
              "rawtype-typing-char",
              characterStateClass,
              characterStateClass === "rawtype-char-correct" ? `rawtype-feedback-${typingFeedbackAnimation}` : "",
              characterStateClass === "rawtype-char-error" ? `rawtype-error-${errorFeedbackAnimation}` : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <span
                key={charIndex}
                ref={isCaretTarget ? caretTargetRef : undefined}
                className={characterClassName}
                data-caret-placement={showCaretAfterChar ? "after" : isInitialCaretAtFirstChar ? "inside-start" : "before"}
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
        {renderSpace(`${itemKey}-space`, showSpaceCursor)}
      </span>
    );
  }

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
              {mode === "custom" ? text.loadingCustom : mode === "words" ? text.loadingWords : text.loadingText}
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
              className={`rawtype-typing-stage ${focusMode === "onelinemode" ? "rawtype-typing-stage-oneline" : ""}`}
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
                width: focusMode === "onelinemode" ? "min(100%, 980px)" : "max-content",
                maxWidth: "min(100%, 980px)",
                overflowX: focusMode === "onelinemode" ? "auto" : "visible",
                overflowY: "hidden",
                verticalAlign: "top"
              }}
            >
              {focusMode === "columns" ? (
                <div key={`columns-window-${activeColumnRowIndex}`} style={wordListStyle}>
                  {visibleColumnRows.map((row) => (
                    <div
                      key={`columns-row-${row.startWordIndex}`}
                      className="rawtype-focus-column-row"
                      style={{
                        minHeight: "42px",
                        display: "flex",
                        flexWrap: "nowrap",
                        alignItems: "flex-end",
                        columnGap: 0,
                        overflow: "hidden"
                      }}
                    >
                      {row.words.map(({ word, wordIndex }) =>
                        renderTypingWord(`columns-${row.rowIndex}-${wordIndex}`, word, wordIndex, row.focusDistance)
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={wordListStyle}>
                  {visibleWordEntries.map(({ word, wordIndex, focusDistance }) =>
                    renderTypingWord(`${wordIndex}`, word, wordIndex, focusDistance)
                  )}
                </div>
              )}
              <GlidingCaret
                box={caretBox}
                caretAnimationStyle={caretAnimationStyle}
                caretMovementAnimation={effectiveCaretMovementAnimation}
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
            <MetricCard label="CPM" value={cpm} metricValueAnimationStyle={metricValueAnimationStyle} />
            <MetricCard label="WPM" value={wpm} metricValueAnimationStyle={metricValueAnimationStyle} />
            <MetricCard
              label={text.metricAccuracy}
              value={`${accuracy}%`}
              metricValueAnimationStyle={metricValueAnimationStyle}
            />
            <MetricCard
              label={text.metricProgress}
              value={`${currentWordIndex}/${totalWords}`}
              metricValueAnimationStyle={metricValueAnimationStyle}
            />
            <MetricCard label={text.metricErrors} value={mistakes} metricValueAnimationStyle={metricValueAnimationStyle} />
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
            <MetricCard label="CPM" value={cpm} metricValueAnimationStyle={metricValueAnimationStyle} />
            <MetricCard label="WPM" value={wpm} metricValueAnimationStyle={metricValueAnimationStyle} />
            <MetricCard
              label={text.metricAccuracy}
              value={`${accuracy}%`}
              metricValueAnimationStyle={metricValueAnimationStyle}
            />
            <MetricCard
              label={text.metricDuration}
              value={`${durationSeconds}s`}
              metricValueAnimationStyle={metricValueAnimationStyle}
            />
            <MetricCard label={text.metricKeystrokes} value={typedChars} metricValueAnimationStyle={metricValueAnimationStyle} />
            <MetricCard
              label={text.metricCorrectKeystrokes}
              value={correctChars}
              metricValueAnimationStyle={metricValueAnimationStyle}
            />
            <MetricCard label={text.metricErrors} value={mistakes} metricValueAnimationStyle={metricValueAnimationStyle} />
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
