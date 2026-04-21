import { useEffect, useState } from "react";
import type { TypingFont, TypingLanguage } from "../games/typing/types";
import { BUILT_IN_THEMES, getBuiltInThemeName } from "../themes/registry";
import type { ThemeId } from "../themes/types";
import { FONT_OPTIONS, LANGUAGE_OPTIONS, type SelectOption } from "./preferences";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid var(--border-strong)",
  borderRadius: "8px",
  padding: "9px 10px",
  backgroundColor: "var(--input-muted)",
  color: "var(--text)",
  fontWeight: 600
};

const groupStyle = {
  border: "1px solid var(--border-soft)",
  borderRadius: "8px",
  padding: "14px",
  display: "grid",
  gap: "12px"
};

function SettingGroup({
  title,
  children,
  singleColumn = false
}: {
  title: string;
  children: React.ReactNode;
  singleColumn?: boolean;
}) {
  return (
    <section style={groupStyle}>
      <h2 style={{ margin: 0, fontSize: "19px" }}>{title}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: singleColumn ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px"
        }}
      >
        {children}
      </div>
    </section>
  );
}

function SelectSetting<T extends string>({
  label,
  value,
  options,
  disabled = true,
  onChange
}: {
  label: string;
  value: T;
  options: ReadonlyArray<SelectOption<T>>;
  disabled?: boolean;
  onChange?: (value: T) => void;
}) {
  return (
    <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
      <span style={{ fontSize: "13px" }}>{label}</span>
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange?.(event.target.value as T)}
        style={fieldStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleSetting({
  label,
  checked,
  disabled = true,
  onChange
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: "8px",
        padding: "9px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        color: "var(--muted-strong)",
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer"
      }}
    >
      <span style={{ fontSize: "13px" }}>{label}</span>
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
      />
    </label>
  );
}

function ColorSetting({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: "8px",
        padding: "9px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        color: "var(--muted-strong)",
        fontWeight: 700
      }}
    >
      <span style={{ fontSize: "13px" }}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        style={{
          width: "34px",
          height: "26px",
          border: "1px solid var(--border-strong)",
          borderRadius: "6px",
          backgroundColor: "transparent",
          padding: 0,
          cursor: "pointer"
        }}
      />
    </div>
  );
}

function ThemePickerWindow({
  open,
  activeTheme,
  selectedTheme,
  onSelectTheme,
  onClose,
  onApply
}: {
  open: boolean;
  activeTheme: ThemeId;
  selectedTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.38)",
        display: "grid",
        placeItems: "center",
        padding: "20px",
        zIndex: 80
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Theme Window"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(860px, 100%)",
          maxHeight: "85vh",
          overflowY: "auto",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          backgroundColor: "var(--surface)",
          display: "grid",
          gap: "14px",
          padding: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px" }}>Theme</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>
              Active: {getBuiltInThemeName(activeTheme)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              padding: "7px 12px",
              backgroundColor: "var(--surface-soft)",
              color: "var(--text)",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>

        <section style={groupStyle}>
          <h3 style={{ margin: 0, fontSize: "17px" }}>Built-in</h3>
          <div
            style={{
              display: "grid",
              gap: "10px",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))"
            }}
          >
            {BUILT_IN_THEMES.map((themeOption) => {
              const selected = selectedTheme === themeOption.id;

              return (
                <button
                  key={themeOption.id}
                  type="button"
                  onClick={() => onSelectTheme(themeOption.id)}
                  style={{
                    border: selected ? "2px solid var(--primary)" : "1px solid var(--border-soft)",
                    borderRadius: "8px",
                    backgroundColor: "var(--surface-soft)",
                    padding: "10px",
                    display: "grid",
                    gap: "8px",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "6px" }}>
                    <span style={{ height: "22px", borderRadius: "4px", backgroundColor: themeOption.swatches.page }} />
                    <span
                      style={{ height: "22px", borderRadius: "4px", backgroundColor: themeOption.swatches.surface }}
                    />
                    <span style={{ height: "22px", borderRadius: "4px", backgroundColor: themeOption.swatches.text }} />
                    <span
                      style={{ height: "22px", borderRadius: "4px", backgroundColor: themeOption.swatches.accent }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>{themeOption.name}</div>
                    <div style={{ marginTop: "4px", color: "var(--muted)", fontSize: "12px" }}>
                      {themeOption.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={groupStyle}>
          <h3 style={{ margin: 0, fontSize: "17px" }}>Community</h3>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Coming soon</div>
        </section>

        <section style={groupStyle}>
          <h3 style={{ margin: 0, fontSize: "17px" }}>Creator Uploads</h3>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Upload support scaffolded, UI coming soon</div>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              padding: "8px 12px",
              backgroundColor: "var(--surface-soft)",
              color: "var(--text)",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            style={{
              border: "1px solid var(--primary)",
              borderRadius: "8px",
              padding: "8px 12px",
              backgroundColor: "var(--primary)",
              color: "var(--primary-text)",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Apply Theme
          </button>
        </div>
      </section>
    </div>
  );
}

function ThemeSetting({
  theme,
  onThemeChange
}: {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}) {
  const [themeWindowOpen, setThemeWindowOpen] = useState(false);
  const [draftTheme, setDraftTheme] = useState<ThemeId>(theme);
  const [themeBeforePreview, setThemeBeforePreview] = useState<ThemeId>(theme);

  useEffect(() => {
    if (!themeWindowOpen) {
      setDraftTheme(theme);
      setThemeBeforePreview(theme);
    }
  }, [theme, themeWindowOpen]);

  function openThemeWindow() {
    setThemeBeforePreview(theme);
    setDraftTheme(theme);
    setThemeWindowOpen(true);
  }

  function handleThemePreview(nextTheme: ThemeId) {
    setDraftTheme(nextTheme);
    onThemeChange(nextTheme);
  }

  function closeThemeWindowWithoutApply() {
    onThemeChange(themeBeforePreview);
    setDraftTheme(themeBeforePreview);
    setThemeWindowOpen(false);
  }

  function applyTheme() {
    onThemeChange(draftTheme);
    setThemeWindowOpen(false);
  }

  return (
    <>
      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: "8px",
          backgroundColor: "var(--surface-soft)",
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px"
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "19px" }}>Theme</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>
            Active: {getBuiltInThemeName(theme)}
          </p>
        </div>

        <button
          type="button"
          onClick={openThemeWindow}
          style={{
            border: "1px solid var(--border-strong)",
            borderRadius: "8px",
            padding: "8px 12px",
            backgroundColor: "var(--surface)",
            color: "var(--text)",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Open Theme Window
        </button>
      </section>

      <ThemePickerWindow
        open={themeWindowOpen}
        activeTheme={theme}
        selectedTheme={draftTheme}
        onSelectTheme={handleThemePreview}
        onClose={closeThemeWindowWithoutApply}
        onApply={applyTheme}
      />
    </>
  );
}

type SettingsPanelProps = {
  theme: ThemeId;
  font: TypingFont;
  language: TypingLanguage;
  highlightCorrectWords: boolean;
  highlightErrorFromPoint: boolean;
  showOnScreenKeyboard: boolean;
  correctMarkerColor: string;
  errorMarkerColor: string;
  onThemeChange: (theme: ThemeId) => void;
  onFontChange: (font: TypingFont) => void;
  onLanguageChange: (language: TypingLanguage) => void;
  onHighlightCorrectWordsChange: (enabled: boolean) => void;
  onHighlightErrorFromPointChange: (enabled: boolean) => void;
  onShowOnScreenKeyboardChange: (enabled: boolean) => void;
  onCorrectMarkerColorChange: (value: string) => void;
  onErrorMarkerColorChange: (value: string) => void;
};

export default function SettingsPanel({
  theme,
  font,
  language,
  highlightCorrectWords,
  highlightErrorFromPoint,
  showOnScreenKeyboard,
  correctMarkerColor,
  errorMarkerColor,
  onThemeChange,
  onFontChange,
  onLanguageChange,
  onHighlightCorrectWordsChange,
  onHighlightErrorFromPointChange,
  onShowOnScreenKeyboardChange,
  onCorrectMarkerColorChange,
  onErrorMarkerColorChange
}: SettingsPanelProps) {
  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        backgroundColor: "var(--surface)",
        padding: "20px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
        <h1 style={{ margin: 0, fontSize: "32px" }}>Settings</h1>
        <span
          style={{
            border: "1px solid var(--border-soft)",
            borderRadius: "999px",
            padding: "4px 10px",
            color: "var(--muted)",
            fontSize: "12px",
            fontWeight: 700
          }}
        >
          Preview
        </span>
      </div>

      <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
        <ThemeSetting theme={theme} onThemeChange={onThemeChange} />

        <SettingGroup title="General Settings">
          <SelectSetting
            label="Language"
            value={language}
            disabled={false}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
          />
          <SelectSetting
            label="Font"
            value={font}
            disabled={false}
            onChange={onFontChange}
            options={FONT_OPTIONS}
          />
        </SettingGroup>

        <SettingGroup title="Typing Defaults">
          <SelectSetting
            label="Mode"
            value="Sentences"
            options={[
              { value: "Sentences", label: "Sentences" },
              { value: "Words", label: "Words" }
            ]}
          />
          <SelectSetting
            label="Word Count"
            value="25"
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "75", label: "75" }
            ]}
          />
          <SelectSetting
            label="Difficulty"
            value="Mixed"
            options={[
              { value: "Easy", label: "Easy" },
              { value: "Medium", label: "Medium" },
              { value: "Hard", label: "Hard" },
              { value: "Mixed", label: "Mixed" }
            ]}
          />
        </SettingGroup>

        <SettingGroup title="Training">
          <ToggleSetting label="No Mistake Mode" checked={false} />
          <ToggleSetting label="Auto Focus Typing Area" checked />
          <ToggleSetting label="Show Error Breakdown" checked />
        </SettingGroup>

        <SettingGroup title="Word Marking" singleColumn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px"
            }}
          >
            <div style={{ display: "grid", gap: "8px", alignContent: "start" }}>
              <ToggleSetting
                label="Correct Word Marker (Green)"
                checked={highlightCorrectWords}
                disabled={false}
                onChange={onHighlightCorrectWordsChange}
              />
              {highlightCorrectWords && (
                <ColorSetting
                  label="Change Color (Correct)"
                  value={correctMarkerColor}
                  onChange={onCorrectMarkerColorChange}
                />
              )}
            </div>

            <div style={{ display: "grid", gap: "8px", alignContent: "start" }}>
              <ToggleSetting
                label="Error Marker From First Mistake (Red)"
                checked={highlightErrorFromPoint}
                disabled={false}
                onChange={onHighlightErrorFromPointChange}
              />
              {highlightErrorFromPoint && (
                <ColorSetting
                  label="Change Color (Error)"
                  value={errorMarkerColor}
                  onChange={onErrorMarkerColorChange}
                />
              )}
            </div>
          </div>
        </SettingGroup>

        <SettingGroup title="Keyboard">
          <ToggleSetting
            label="Show On-Screen Keyboard"
            checked={showOnScreenKeyboard}
            disabled={false}
            onChange={onShowOnScreenKeyboardChange}
          />
        </SettingGroup>

        <SettingGroup title="Privacy And Data">
          <ToggleSetting label="Save Runs To Account" checked />
          <ToggleSetting label="Save Error Words" checked />
          <ToggleSetting label="Public Profile" checked={false} />
        </SettingGroup>
      </div>
    </section>
  );
}
