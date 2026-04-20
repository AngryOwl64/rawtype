import type { TypingFont, TypingLanguage } from "../games/typing/types";

type SelectOption = {
  value: string;
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

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={groupStyle}>
      <h2 style={{ margin: 0, fontSize: "19px" }}>{title}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px"
        }}
      >
        {children}
      </div>
    </section>
  );
}

function SelectSetting({
  label,
  value,
  options,
  disabled = true,
  onChange
}: {
  label: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: "6px", color: "var(--muted-strong)", fontWeight: 700 }}>
      <span style={{ fontSize: "13px" }}>{label}</span>
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
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

function ToggleSetting({ label, checked }: { label: string; checked: boolean }) {
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
        fontWeight: 700
      }}
    >
      <span style={{ fontSize: "13px" }}>{label}</span>
      <input type="checkbox" disabled checked={checked} onChange={() => undefined} />
    </label>
  );
}

function DarkModeSetting({
  enabled,
  onChange
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
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
        <h2 style={{ margin: 0, fontSize: "19px" }}>Dark Mode</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>
          Switch the interface to a darker color scheme.
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        style={{
          border: "1px solid var(--border-strong)",
          borderRadius: "999px",
          padding: "4px",
          width: "54px",
          height: "30px",
          backgroundColor: enabled ? "var(--success)" : "var(--border-strong)",
          cursor: "pointer",
          position: "relative",
          flex: "0 0 auto"
        }}
      >
        <span
          style={{
            display: "block",
            width: "20px",
            height: "20px",
            borderRadius: "999px",
            backgroundColor: "var(--surface)",
            transform: enabled ? "translateX(24px)" : "translateX(0)",
            transition: "transform 120ms ease"
          }}
        />
      </button>
    </section>
  );
}

type SettingsPanelProps = {
  darkMode: boolean;
  font: TypingFont;
  language: TypingLanguage;
  onDarkModeChange: (enabled: boolean) => void;
  onFontChange: (font: TypingFont) => void;
  onLanguageChange: (language: TypingLanguage) => void;
};

export default function SettingsPanel({
  darkMode,
  font,
  language,
  onDarkModeChange,
  onFontChange,
  onLanguageChange
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
        <DarkModeSetting enabled={darkMode} onChange={onDarkModeChange} />

        <SettingGroup title="General Settings">
          <SelectSetting
            label="Language"
            value={language}
            disabled={false}
            onChange={(value) => onLanguageChange(value as TypingLanguage)}
            options={[
              { value: "en", label: "English" },
              { value: "de", label: "German" }
            ]}
          />
          <SelectSetting
            label="Font"
            value={font}
            disabled={false}
            onChange={(value) => onFontChange(value as TypingFont)}
            options={[
              { value: "system-mono", label: "System mono" },
              { value: "sans", label: "Sans" },
              { value: "serif", label: "Serif" }
            ]}
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

        <SettingGroup title="Privacy And Data">
          <ToggleSetting label="Save Runs To Account" checked />
          <ToggleSetting label="Save Error Words" checked />
          <ToggleSetting label="Public Profile" checked={false} />
        </SettingGroup>
      </div>
    </section>
  );
}
