// Responsive on-screen keyboard used as a visual typing aid.
// Sizes keys to fit the available game width.
import { memo, useEffect, useMemo, useRef, useState } from "react";

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

export const OnScreenKeyboard = memo(function OnScreenKeyboard({
  activeKeys,
  title
}: {
  activeKeys: Set<string>;
  title: string;
}) {
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
      <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700 }}>{title}</div>

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
