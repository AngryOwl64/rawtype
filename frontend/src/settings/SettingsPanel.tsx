// Settings UI for theme, language, font, and typing highlights.
// Keeps user-facing preference controls grouped in one panel.
import { useEffect, useState, type FormEvent } from "react";
import AccountSettingsSection from "../account/AccountSettingsSection";
import { useAuth } from "../auth/authContext";
import { deleteSavedTypingData } from "../games/typing/services/runResults";
import type { AppFont, CustomFont, OnScreenKeyboardLayout, RestartKey, TextFont, TypingLanguage } from "../games/typing/types";
import type { TypingMode, WordModeDifficulty, WordNoMistakeMode } from "../games/typing/types";
import { getSettingsTexts, translateAccountText } from "../i18n/messages";
import {
  BUILT_IN_THEMES,
  getBuiltInThemeDescription,
  getBuiltInThemeName,
  type ThemeId
} from "../themes/registry";
import { APP_FONT_OPTIONS, LANGUAGE_OPTIONS, TEXT_FONT_OPTIONS, type SelectOption } from "./preferences";

export type SettingsCategory = "appearance" | "typing" | "markers" | "keyboard" | "privacy" | "account";

export type SettingsCategoryItem = {
  id: SettingsCategory;
  label: string;
};

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

function CustomFontImporter({
  language,
  customFonts,
  disabled,
  importing,
  error,
  onImport,
  onDelete
}: {
  language: TypingLanguage;
  customFonts: CustomFont[];
  disabled: boolean;
  importing: boolean;
  error: string;
  onImport: (url: string) => Promise<void>;
  onDelete: (font: CustomFont) => void;
}) {
  const [fontUrl, setFontUrl] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const isGerman = language === "de";
  const guideText = isGerman
    ? "Google Fonts öffnen, eine Schrift auswählen, <link>-URL mit fonts.googleapis.com/css2 kopieren und hier einfügen."
    : "Open Google Fonts, choose a family, copy the <link> URL with fonts.googleapis.com/css2, and paste it here.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onImport(fontUrl);
    setFontUrl("");
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: "10px" }}>
      <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
        <span style={{ fontSize: "13px" }}>Google Fonts Link</span>
        <span style={{ position: "relative", display: "block" }}>
          <input
            type="url"
            value={fontUrl}
            disabled={disabled || importing}
            onChange={(event) => setFontUrl(event.target.value)}
            placeholder="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
            style={{ ...fieldStyle, paddingRight: "42px" }}
          />
          <button
            type="button"
            aria-label={isGerman ? "Anleitung für Font-Import" : "Font import guide"}
            onMouseEnter={() => setGuideOpen(true)}
            onMouseLeave={() => setGuideOpen(false)}
            onFocus={() => setGuideOpen(true)}
            onBlur={() => setGuideOpen(false)}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "24px",
              height: "24px",
              border: "1px solid var(--border-strong)",
              borderRadius: "999px",
              backgroundColor: "var(--surface)",
              color: "var(--muted-strong)",
              cursor: "help",
              fontSize: "13px",
              fontWeight: 900,
              lineHeight: 1
            }}
          >
            i
          </button>
          {guideOpen && (
            <span
              role="tooltip"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                zIndex: 20,
                width: "min(320px, 80vw)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                color: "var(--text)",
                boxShadow: "0 14px 34px rgba(0, 0, 0, 0.22)",
                padding: "10px 12px",
                fontSize: "12px",
                fontWeight: 600,
                lineHeight: 1.45
              }}
            >
              {guideText}
            </span>
          )}
        </span>
      </label>
      <button
        type="submit"
        disabled={disabled || importing || fontUrl.trim().length === 0}
        style={{
          border: "1px solid var(--primary)",
          borderRadius: "8px",
          padding: "9px 12px",
          backgroundColor: disabled ? "var(--surface-soft)" : "var(--primary)",
          color: disabled ? "var(--muted)" : "var(--primary-text)",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 800
        }}
      >
        {importing ? "Importing..." : "Import Font"}
      </button>
      {disabled && (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
          Login to import fonts for your account.
        </p>
      )}
      {error && <p style={{ margin: 0, color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
      {customFonts.length > 0 && (
        <div style={{ display: "grid", gap: "8px" }}>
          {customFonts.map((font) => (
            <div
              key={font.id}
              style={{
                border: "1px solid var(--border-soft)",
                borderRadius: "8px",
                padding: "8px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {font.familyName}
              </span>
              <button
                type="button"
                onClick={() => onDelete(font)}
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  backgroundColor: "var(--surface-soft)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontWeight: 700
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

function PrivacyDataSettings({
  language,
  saveRunsToAccount,
  saveErrorWords,
  showErrorBreakdown,
  onSaveRunsToAccountChange,
  onSaveErrorWordsChange,
  onShowErrorBreakdownChange
}: {
  language: TypingLanguage;
  saveRunsToAccount: boolean;
  saveErrorWords: boolean;
  showErrorBreakdown: boolean;
  onSaveRunsToAccountChange: (enabled: boolean) => void;
  onSaveErrorWordsChange: (enabled: boolean) => void;
  onShowErrorBreakdownChange: (enabled: boolean) => void;
}) {
  const text = getSettingsTexts(language);
  const { user } = useAuth();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "deleting" | "deleted">("idle");
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteSavedData() {
    setDeleteError("");
    setDeleteState("deleting");

    try {
      await deleteSavedTypingData();
      setDeleteConfirmationOpen(false);
      setDeleteState("deleted");
    } catch (error) {
      setDeleteState("idle");
      setDeleteError(error instanceof Error ? error.message : text.page.deleteSavedDataFailed);
    }
  }

  return (
    <>
      <ToggleSetting
        label={text.page.saveRuns}
        checked={saveRunsToAccount}
        disabled={false}
        onChange={onSaveRunsToAccountChange}
      />
      <ToggleSetting
        label={text.page.saveErrorWords}
        checked={saveRunsToAccount && saveErrorWords}
        disabled={!saveRunsToAccount}
        onChange={onSaveErrorWordsChange}
      />
      <ToggleSetting
        label={text.page.showErrorBreakdownPrivacy}
        checked={showErrorBreakdown}
        disabled={false}
        onChange={onShowErrorBreakdownChange}
      />
      <div style={{ display: "grid", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setDeleteConfirmationOpen(true)}
          disabled={!user || deleteState === "deleting"}
          style={{
            border: "1px solid var(--danger-border)",
            borderRadius: "8px",
            padding: "10px 12px",
            backgroundColor: user ? "var(--danger-bg)" : "var(--surface-soft)",
            color: user ? "var(--danger)" : "var(--muted)",
            cursor: user ? "pointer" : "not-allowed",
            fontWeight: 800
          }}
        >
          {deleteState === "deleting"
            ? text.page.deletingSavedData
            : deleteState === "deleted"
              ? text.page.savedDataDeleted
              : text.page.deleteSavedData}
        </button>
        {!user && (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px", lineHeight: 1.45 }}>
            {text.page.loginToDeleteData}
          </p>
        )}
        {deleteError && <p style={{ margin: 0, color: "var(--danger)", fontSize: "13px" }}>{deleteError}</p>}
      </div>

      {deleteConfirmationOpen && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            backgroundColor: "rgba(0, 0, 0, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: "20px"
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-data-title"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "8px",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              padding: "18px",
              width: "min(100%, 420px)",
              boxSizing: "border-box",
              boxShadow: "0 18px 48px rgba(0, 0, 0, 0.28)",
              display: "grid",
              gap: "12px"
            }}
          >
            <h2 id="delete-data-title" style={{ margin: 0, fontSize: "22px" }}>
              {text.page.deleteSavedDataTitle}
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
              {text.page.deleteSavedDataDescription}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmationOpen(false)}
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  backgroundColor: "var(--surface-soft)",
                  color: "var(--text)",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {text.themeWindow.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteSavedData()}
                disabled={deleteState === "deleting"}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  backgroundColor: "var(--danger)",
                  color: "var(--primary-text)",
                  fontWeight: 800,
                  cursor: deleteState === "deleting" ? "default" : "pointer"
                }}
              >
                {text.page.confirmDeleteSavedData}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

type SettingsPanelProps = {
  activeCategory: SettingsCategory;
  theme: ThemeId;
  appFont: AppFont;
  textFont: TextFont;
  customFonts: CustomFont[];
  fontImporting: boolean;
  fontImportError: string;
  language: TypingLanguage;
  defaultTypingMode: TypingMode;
  defaultWordsCount: number;
  defaultWordDifficulty: WordModeDifficulty;
  defaultNoMistakeMode: WordNoMistakeMode;
  highlightCorrectWords: boolean;
  highlightErrorFromPoint: boolean;
  showOnScreenKeyboard: boolean;
  onScreenKeyboardLayout: OnScreenKeyboardLayout;
  restartKey: RestartKey;
  saveRunsToAccount: boolean;
  saveErrorWords: boolean;
  showErrorBreakdown: boolean;
  correctMarkerColor: string;
  errorMarkerColor: string;
  onThemeChange: (theme: ThemeId) => void;
  onAppFontChange: (font: AppFont) => void;
  onTextFontChange: (font: TextFont) => void;
  onImportFont: (url: string) => Promise<void>;
  onDeleteFont: (font: CustomFont) => void;
  onLanguageChange: (language: TypingLanguage) => void;
  onDefaultTypingModeChange: (mode: TypingMode) => void;
  onDefaultWordsCountChange: (wordsCount: number) => void;
  onDefaultWordDifficultyChange: (difficulty: WordModeDifficulty) => void;
  onDefaultNoMistakeModeChange: (mode: WordNoMistakeMode) => void;
  onHighlightCorrectWordsChange: (enabled: boolean) => void;
  onHighlightErrorFromPointChange: (enabled: boolean) => void;
  onShowOnScreenKeyboardChange: (enabled: boolean) => void;
  onOnScreenKeyboardLayoutChange: (layout: OnScreenKeyboardLayout) => void;
  onRestartKeyChange: (key: RestartKey) => void;
  onSaveRunsToAccountChange: (enabled: boolean) => void;
  onSaveErrorWordsChange: (enabled: boolean) => void;
  onShowErrorBreakdownChange: (enabled: boolean) => void;
  onCorrectMarkerColorChange: (value: string) => void;
  onErrorMarkerColorChange: (value: string) => void;
  onCategoryChange: (category: SettingsCategory) => void;
};

export default function SettingsPanel({
  activeCategory,
  theme,
  appFont,
  textFont,
  customFonts,
  fontImporting,
  fontImportError,
  language,
  defaultTypingMode,
  defaultWordsCount,
  defaultWordDifficulty,
  defaultNoMistakeMode,
  highlightCorrectWords,
  highlightErrorFromPoint,
  showOnScreenKeyboard,
  onScreenKeyboardLayout,
  restartKey,
  saveRunsToAccount,
  saveErrorWords,
  showErrorBreakdown,
  correctMarkerColor,
  errorMarkerColor,
  onThemeChange,
  onAppFontChange,
  onTextFontChange,
  onImportFont,
  onDeleteFont,
  onLanguageChange,
  onDefaultTypingModeChange,
  onDefaultWordsCountChange,
  onDefaultWordDifficultyChange,
  onDefaultNoMistakeModeChange,
  onHighlightCorrectWordsChange,
  onHighlightErrorFromPointChange,
  onShowOnScreenKeyboardChange,
  onOnScreenKeyboardLayoutChange,
  onRestartKeyChange,
  onSaveRunsToAccountChange,
  onSaveErrorWordsChange,
  onShowErrorBreakdownChange,
  onCorrectMarkerColorChange,
  onErrorMarkerColorChange,
  onCategoryChange
}: SettingsPanelProps) {
  const text = getSettingsTexts(language);
  const accountText = (en: string) => translateAccountText(language, en);
  const categories: SettingsCategoryItem[] = [
    { id: "appearance", label: text.page.appearance },
    { id: "typing", label: text.page.typing },
    { id: "markers", label: text.page.wordMarking },
    { id: "keyboard", label: text.page.keyboard },
    { id: "privacy", label: text.page.privacyData },
    { id: "account", label: accountText("Account Settings") }
  ];
  const keyboardLayoutOptions: Array<SelectOption<OnScreenKeyboardLayout>> = [
    { value: "us-qwerty", label: text.page.keyboardLayoutUs },
    { value: "uk-qwerty", label: text.page.keyboardLayoutUk },
    { value: "de-qwertz", label: text.page.keyboardLayoutDe },
    { value: "fr-azerty", label: text.page.keyboardLayoutFr },
    { value: "es-qwerty", label: text.page.keyboardLayoutEs }
  ];
  const restartKeyOptions: Array<SelectOption<RestartKey>> = [
    { value: "Enter", label: text.page.restartKeyEnter },
    { value: "Escape", label: text.page.restartKeyEscape }
  ];
  const typingModeOptions: Array<SelectOption<TypingMode>> = [
    { value: "sentences", label: text.page.modeSentences },
    { value: "words", label: text.page.modeWords }
  ];
  const wordsCountOptions: Array<SelectOption<string>> = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "75", label: "75" }
  ];
  const difficultyOptions: Array<SelectOption<WordModeDifficulty>> = [
    { value: "easy", label: text.page.easy },
    { value: "medium", label: text.page.medium },
    { value: "hard", label: text.page.hard },
    { value: "mixed", label: text.page.mixed }
  ];
  const customFontOptions: Array<SelectOption<AppFont>> = customFonts.map((font) => ({
    value: font.selection,
    label: font.familyName
  }));
  const appFontOptions: Array<SelectOption<AppFont>> = [...APP_FONT_OPTIONS, ...customFontOptions];
  const textFontOptions: Array<SelectOption<TextFont>> = [...TEXT_FONT_OPTIONS, ...customFontOptions];
  const { user } = useAuth();

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(150px, 190px) 1fr",
          gap: "16px",
          alignItems: "start",
          marginTop: "18px"
        }}
      >
        <nav
          aria-label={text.page.settingsCategories}
          style={{
            border: "1px solid var(--border-soft)",
            borderRadius: "8px",
            padding: "8px",
            display: "grid",
            gap: "6px",
            backgroundColor: "var(--surface-soft)",
            position: "sticky",
            top: "86px"
          }}
        >
          {categories.map((category) => {
            const selected = category.id === activeCategory;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                style={{
                  border: "1px solid",
                  borderColor: selected ? "var(--primary)" : "transparent",
                  borderRadius: "8px",
                  width: "100%",
                  boxSizing: "border-box",
                  minWidth: 0,
                  padding: "10px 11px",
                  backgroundColor: selected ? "var(--primary)" : "transparent",
                  color: selected ? "var(--primary-text)" : "var(--text)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: 700
                }}
              >
                {category.label}
              </button>
            );
          })}
        </nav>

        <div style={{ display: "grid", gap: "14px", minWidth: 0 }}>
          {activeCategory === "appearance" && (
            <>
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
                  options={appFontOptions}
                />
                <SelectSetting
                  label={text.page.textFont}
                  value={textFont}
                  disabled={false}
                  onChange={onTextFontChange}
                  options={textFontOptions}
                />
              </SettingGroup>
              <SettingGroup title="Custom Fonts" singleColumn>
                <CustomFontImporter
                  language={language}
                  customFonts={customFonts}
                  disabled={!user}
                  importing={fontImporting}
                  error={fontImportError}
                  onImport={onImportFont}
                  onDelete={onDeleteFont}
                />
              </SettingGroup>
            </>
          )}

          {activeCategory === "typing" && (
            <>
              <SettingGroup title={text.page.typingDefaults}>
                <SelectSetting
                  label={text.page.mode}
                  value={defaultTypingMode}
                  disabled={false}
                  onChange={onDefaultTypingModeChange}
                  options={typingModeOptions}
                />
                <SelectSetting
                  label={text.page.wordCount}
                  value={String(defaultWordsCount)}
                  disabled={false}
                  onChange={(value) => onDefaultWordsCountChange(Number(value))}
                  options={wordsCountOptions}
                />
                <SelectSetting
                  label={text.page.difficulty}
                  value={defaultWordDifficulty}
                  disabled={false}
                  onChange={onDefaultWordDifficultyChange}
                  options={difficultyOptions}
                />
              </SettingGroup>

              <SettingGroup title={text.page.training}>
                <ToggleSetting
                  label={text.page.noMistakeMode}
                  checked={defaultNoMistakeMode === "on"}
                  disabled={false}
                  onChange={(enabled) => onDefaultNoMistakeModeChange(enabled ? "on" : "off")}
                />
                <ToggleSetting label={text.page.autoFocus} checked />
              </SettingGroup>
            </>
          )}

          {activeCategory === "markers" && (
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
          )}

          {activeCategory === "keyboard" && (
            <SettingGroup title={text.page.keyboard}>
              <SelectSetting
                label={text.page.restartKey}
                value={restartKey}
                disabled={false}
                onChange={onRestartKeyChange}
                options={restartKeyOptions}
              />
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
          )}

          {activeCategory === "privacy" && (
            <SettingGroup title={text.page.privacyData} singleColumn>
              <PrivacyDataSettings
                language={language}
                saveRunsToAccount={saveRunsToAccount}
                saveErrorWords={saveErrorWords}
                showErrorBreakdown={showErrorBreakdown}
                onSaveRunsToAccountChange={onSaveRunsToAccountChange}
                onSaveErrorWordsChange={onSaveErrorWordsChange}
                onShowErrorBreakdownChange={onShowErrorBreakdownChange}
              />
            </SettingGroup>
          )}

          {activeCategory === "account" && (
            <SettingGroup title={accountText("Account Settings")} singleColumn>
              <AccountSettingsSection language={language} />
            </SettingGroup>
          )}
        </div>
      </div>
    </section>
  );
}
