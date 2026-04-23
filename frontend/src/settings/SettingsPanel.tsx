// Settings UI for theme, language, font, and typing highlights.
// Keeps user-facing preference controls grouped in one panel.
import { useEffect, useState } from "react";
import type { AppFont, OnScreenKeyboardLayout, TextFont, TypingLanguage } from "../games/typing/types";
import { getSettingsTexts } from "../i18n/messages";
import {
  BUILT_IN_THEMES,
  getBuiltInThemeDescription,
  getBuiltInThemeName,
  type ThemeId
} from "../themes/registry";
import { APP_FONT_OPTIONS, LANGUAGE_OPTIONS, TEXT_FONT_OPTIONS, type SelectOption } from "./preferences";

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
  language,
  open,
  activeTheme,
  selectedTheme,
  onSelectTheme,
  onClose,
  onApply
}: {
  language: TypingLanguage;
  open: boolean;
  activeTheme: ThemeId;
  selectedTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const text = getSettingsTexts(language);

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
        aria-label={text.themeWindow.ariaLabel}
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
            <h2 style={{ margin: 0, fontSize: "24px" }}>{text.themeWindow.title}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>
              {text.themeWindow.active}: {getBuiltInThemeName(activeTheme)}
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
            {text.themeWindow.close}
          </button>
        </div>

        <section style={groupStyle}>
          <h3 style={{ margin: 0, fontSize: "17px" }}>{text.themeWindow.builtIn}</h3>
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
                      {getBuiltInThemeDescription(themeOption.id, language)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={groupStyle}>
          <h3 style={{ margin: 0, fontSize: "17px" }}>{text.themeWindow.community}</h3>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>{text.themeWindow.comingSoon}</div>
        </section>

        <section style={groupStyle}>
          <h3 style={{ margin: 0, fontSize: "17px" }}>{text.themeWindow.creatorUploads}</h3>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>{text.themeWindow.uploadComingSoon}</div>
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
            {text.themeWindow.cancel}
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
            {text.themeWindow.applyTheme}
          </button>
        </div>
      </section>
    </div>
  );
}

function ThemeSetting({
  language,
  theme,
  onThemeChange
}: {
  language: TypingLanguage;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}) {
  const text = getSettingsTexts(language);
  const [themeWindowOpen, setThemeWindowOpen] = useState(false);
  const [draftTheme, setDraftTheme] = useState<ThemeId>(theme);
  const [themeBeforePreview, setThemeBeforePreview] = useState<ThemeId>(theme);

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
          <h2 style={{ margin: 0, fontSize: "19px" }}>{text.themeSection.title}</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>
            {text.themeSection.active}: {getBuiltInThemeName(theme)}
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
          {text.themeSection.openWindow}
        </button>
      </section>

      <ThemePickerWindow
        language={language}
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
  appFont: AppFont;
  textFont: TextFont;
  language: TypingLanguage;
  highlightCorrectWords: boolean;
  highlightErrorFromPoint: boolean;
  showOnScreenKeyboard: boolean;
  onScreenKeyboardLayout: OnScreenKeyboardLayout;
  correctMarkerColor: string;
  errorMarkerColor: string;
  onThemeChange: (theme: ThemeId) => void;
  onAppFontChange: (font: AppFont) => void;
  onTextFontChange: (font: TextFont) => void;
  onLanguageChange: (language: TypingLanguage) => void;
  onHighlightCorrectWordsChange: (enabled: boolean) => void;
  onHighlightErrorFromPointChange: (enabled: boolean) => void;
  onShowOnScreenKeyboardChange: (enabled: boolean) => void;
  onOnScreenKeyboardLayoutChange: (layout: OnScreenKeyboardLayout) => void;
  onCorrectMarkerColorChange: (value: string) => void;
  onErrorMarkerColorChange: (value: string) => void;
};

export default function SettingsPanel({
  theme,
  appFont,
  textFont,
  language,
  highlightCorrectWords,
  highlightErrorFromPoint,
  showOnScreenKeyboard,
  onScreenKeyboardLayout,
  correctMarkerColor,
  errorMarkerColor,
  onThemeChange,
  onAppFontChange,
  onTextFontChange,
  onLanguageChange,
  onHighlightCorrectWordsChange,
  onHighlightErrorFromPointChange,
  onShowOnScreenKeyboardChange,
  onOnScreenKeyboardLayoutChange,
  onCorrectMarkerColorChange,
  onErrorMarkerColorChange
}: SettingsPanelProps) {
  const text = getSettingsTexts(language);
  const keyboardLayoutOptions: Array<SelectOption<OnScreenKeyboardLayout>> = [
    { value: "us-qwerty", label: text.page.keyboardLayoutUs },
    { value: "uk-qwerty", label: text.page.keyboardLayoutUk },
    { value: "de-qwertz", label: text.page.keyboardLayoutDe },
    { value: "fr-azerty", label: text.page.keyboardLayoutFr },
    { value: "es-qwerty", label: text.page.keyboardLayoutEs }
  ];

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
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontFamily: "var(--brand-font)",
            fontWeight: 400,
            letterSpacing: "0.02em"
          }}
        >
          {text.page.title}
        </h1>
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
          {text.page.preview}
        </span>
      </div>

      <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
        <ThemeSetting language={language} theme={theme} onThemeChange={onThemeChange} />

        <SettingGroup title={text.page.generalSettings}>
          <SelectSetting
            label={text.page.language}
            value={language}
            disabled={false}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
          />
          <SelectSetting
            label={text.page.generalFont}
            value={appFont}
            disabled={false}
            onChange={onAppFontChange}
            options={APP_FONT_OPTIONS}
          />
          <SelectSetting
            label={text.page.textFont}
            value={textFont}
            disabled={false}
            onChange={onTextFontChange}
            options={TEXT_FONT_OPTIONS}
          />
        </SettingGroup>

        <SettingGroup title={text.page.typingDefaults}>
          <SelectSetting
            label={text.page.mode}
            value={text.page.modeSentences}
            options={[
              { value: text.page.modeSentences, label: text.page.modeSentences },
              { value: text.page.modeWords, label: text.page.modeWords }
            ]}
          />
          <SelectSetting
            label={text.page.wordCount}
            value="25"
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "75", label: "75" }
            ]}
          />
          <SelectSetting
            label={text.page.difficulty}
            value={text.page.mixed}
            options={[
              { value: text.page.easy, label: text.page.easy },
              { value: text.page.medium, label: text.page.medium },
              { value: text.page.hard, label: text.page.hard },
              { value: text.page.mixed, label: text.page.mixed }
            ]}
          />
        </SettingGroup>

        <SettingGroup title={text.page.training}>
          <ToggleSetting label={text.page.noMistakeMode} checked={false} />
          <ToggleSetting label={text.page.autoFocus} checked />
          <ToggleSetting label={text.page.showErrorBreakdown} checked />
        </SettingGroup>

        <SettingGroup title={text.page.wordMarking} singleColumn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px"
            }}
          >
            <div style={{ display: "grid", gap: "8px", alignContent: "start" }}>
              <ToggleSetting
                label={text.page.correctWordMarker}
                checked={highlightCorrectWords}
                disabled={false}
                onChange={onHighlightCorrectWordsChange}
              />
              {highlightCorrectWords && (
                <ColorSetting
                  label={text.page.changeCorrectColor}
                  value={correctMarkerColor}
                  onChange={onCorrectMarkerColorChange}
                />
              )}
            </div>

            <div style={{ display: "grid", gap: "8px", alignContent: "start" }}>
              <ToggleSetting
                label={text.page.errorMarker}
                checked={highlightErrorFromPoint}
                disabled={false}
                onChange={onHighlightErrorFromPointChange}
              />
              {highlightErrorFromPoint && (
                <ColorSetting
                  label={text.page.changeErrorColor}
                  value={errorMarkerColor}
                  onChange={onErrorMarkerColorChange}
                />
              )}
            </div>
          </div>
        </SettingGroup>

        <SettingGroup title={text.page.keyboard}>
          <ToggleSetting
            label={text.page.showOnScreenKeyboard}
            checked={showOnScreenKeyboard}
            disabled={false}
            onChange={onShowOnScreenKeyboardChange}
          />
          <SelectSetting
            label={text.page.keyboardLayout}
            value={onScreenKeyboardLayout}
            disabled={false}
            onChange={onOnScreenKeyboardLayoutChange}
            options={keyboardLayoutOptions}
          />
        </SettingGroup>

        <SettingGroup title={text.page.privacyData}>
          <ToggleSetting label={text.page.saveRuns} checked />
          <ToggleSetting label={text.page.saveErrorWords} checked />
          <ToggleSetting label={text.page.publicProfile} checked={false} />
        </SettingGroup>
      </div>
    </section>
  );
}
