// Start menu for choosing a typing mode and word-mode options.
// Also shows signed-in activity highlights before a run starts.
import type { getAppTexts } from "../i18n/messages";
import { LANGUAGE_OPTIONS } from "../settings/preferences";
import { DailyActivityChart } from "../stats/DailyActivityChart";
import type {
  CustomCasingMode,
  CustomLetterFocus,
  CustomNumberMode,
  CustomPunctuationMode,
  CustomRepeatMode,
  CustomRhythmMode,
  CustomSymbolMode,
  CustomTypingSettings,
  SavedTypingDayStats,
  TypingLanguage,
  WordModeDifficulty,
  WordNoMistakeMode
} from "../games/typing/types";

type AppTexts = ReturnType<typeof getAppTexts>;

type HomeMenuProps = {
  appText: AppTexts;
  currentStreakDays: number;
  dailyActivity: SavedTypingDayStats[];
  language: TypingLanguage;
  gameLanguage: TypingLanguage;
  signedIn: boolean;
  wordDifficulty: WordModeDifficulty;
  wordNoMistakeMode: WordNoMistakeMode;
  wordsCount: number;
  customSettings: CustomTypingSettings;
  onStartClassic: () => void;
  onStartWordMode: () => void;
  onStartCustomMode: () => void;
  onGameLanguageChange: (language: TypingLanguage) => void;
  onWordDifficultyChange: (difficulty: WordModeDifficulty) => void;
  onWordNoMistakeModeChange: (mode: WordNoMistakeMode) => void;
  onWordsCountChange: (count: number) => void;
  onCustomSettingsChange: (settings: CustomTypingSettings) => void;
};

type HomeSelectOption<T extends string> = {
  value: T;
  label: string;
};

const controlLabelStyle = {
  fontSize: "12px",
  color: "var(--muted)",
  marginBottom: "6px",
  fontWeight: 600
};

const controlFieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid var(--border-strong)",
  borderRadius: "8px",
  padding: "8px 10px",
  backgroundColor: "var(--input-bg)",
  color: "var(--text)",
  fontWeight: 600
};

function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: Array<HomeSelectOption<T>>;
  onChange: (value: T) => void;
}) {
  return (
    <label>
      <div style={controlLabelStyle}>{label}</div>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} style={controlFieldStyle}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function HomeMenu({
  appText,
  currentStreakDays,
  dailyActivity,
  language,
  gameLanguage,
  signedIn,
  wordDifficulty,
  wordNoMistakeMode,
  wordsCount,
  customSettings,
  onStartClassic,
  onStartWordMode,
  onStartCustomMode,
  onGameLanguageChange,
  onWordDifficultyChange,
  onWordNoMistakeModeChange,
  onWordsCountChange,
  onCustomSettingsChange
}: HomeMenuProps) {
  const customLetterFocusOptions: Array<HomeSelectOption<CustomLetterFocus>> = [
    { value: "balanced", label: appText.home.customFocusBalanced },
    { value: "home-row", label: appText.home.customFocusHomeRow },
    { value: "top-row", label: appText.home.customFocusTopRow },
    { value: "left-hand", label: appText.home.customFocusLeftHand },
    { value: "right-hand", label: appText.home.customFocusRightHand }
  ];
  const customCasingOptions: Array<HomeSelectOption<CustomCasingMode>> = [
    { value: "natural", label: appText.home.customCasingNatural },
    { value: "lowercase", label: appText.home.customCasingLowercase },
    { value: "uppercase", label: appText.home.customCasingUppercase },
    { value: "title", label: appText.home.customCasingTitle }
  ];
  const levelOptions: Array<HomeSelectOption<CustomPunctuationMode | CustomNumberMode | CustomSymbolMode | CustomRepeatMode>> = [
    { value: "none", label: appText.home.customLevelNone },
    { value: "light", label: appText.home.customLevelLight },
    { value: "dense", label: appText.home.customLevelDense }
  ];
  const customRhythmOptions: Array<HomeSelectOption<CustomRhythmMode>> = [
    { value: "steady", label: appText.home.customRhythmSteady },
    { value: "bursts", label: appText.home.customRhythmBursts },
    { value: "staggered", label: appText.home.customRhythmStaggered }
  ];
  const patchCustomSettings = (updates: Partial<CustomTypingSettings>) =>
    onCustomSettingsChange({ ...customSettings, ...updates });

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap"
        }}
      >
        <h1 style={{ margin: 0, fontSize: "34px" }}>{appText.home.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <label
            style={{
              border: "1px solid var(--border-soft)",
              borderRadius: "8px",
              padding: "7px 10px",
              backgroundColor: "var(--surface)",
              color: "var(--muted-strong)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 700
            }}
          >
            <span style={{ fontSize: "12px" }}>{appText.home.gameLanguage}</span>
            <select
              value={gameLanguage}
              onChange={(event) => onGameLanguageChange(event.target.value as TypingLanguage)}
              style={{
                border: "1px solid var(--border-strong)",
                borderRadius: "6px",
                padding: "5px 8px",
                backgroundColor: "var(--input-bg)",
                color: "var(--text)",
                fontWeight: 700
              }}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {signedIn && (
            <div
              style={{
                border: "1px solid var(--border-soft)",
                borderRadius: "8px",
                padding: "8px 12px",
                backgroundColor: "var(--surface)",
                color: "var(--muted-strong)",
                fontWeight: 700
              }}
            >
              {appText.home.streak}: {currentStreakDays}{" "}
              {currentStreakDays === 1 ? appText.home.day : appText.home.days}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: "22px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "14px"
        }}
      >
        {signedIn && (
          <section
            style={{
              border: "1px solid var(--border)",
              borderRadius: "8px",
              backgroundColor: "var(--surface)",
              padding: "18px",
              display: "grid",
              gap: "12px"
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>{appText.home.dailyActivity}</h2>
            <DailyActivityChart days={dailyActivity} language={language} />
          </section>
        )}

        <article
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            backgroundColor: "var(--surface)",
            padding: "18px"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>{appText.home.classicTitle}</h2>
          <p style={{ marginTop: 0, marginBottom: "14px", color: "var(--muted)", lineHeight: 1.45 }}>
            {appText.home.classicDescription}
          </p>

          <button
            type="button"
            onClick={onStartClassic}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              width: "100%",
              backgroundColor: "var(--success)",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {appText.home.startClassic}
          </button>
        </article>

        <article
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            backgroundColor: "var(--surface)",
            padding: "18px"
          }}
        >
          <div
            style={{
              marginBottom: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gridTemplateRows: "auto auto",
              gap: "10px"
            }}
          >
            <div
              style={{
                gridColumn: "1",
                gridRow: "1",
                fontSize: "18px",
                color: "var(--text)",
                fontWeight: 700,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <span>{appText.home.wordModeTitle}</span>
              <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 400 }}>
                {appText.home.wordModeDescription}
              </span>
            </div>

            <div style={{ gridColumn: "2", gridRow: "1" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginBottom: "6px",
                  fontWeight: 600
                }}
              >
                {appText.home.noMistakeMode}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={wordNoMistakeMode === "on"}
                onClick={() => onWordNoMistakeModeChange(wordNoMistakeMode === "on" ? "off" : "on")}
                style={{
                  width: "100%",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span>{wordNoMistakeMode === "on" ? appText.home.on : appText.home.off}</span>
                <span
                  style={{
                    width: "42px",
                    height: "24px",
                    borderRadius: "999px",
                    backgroundColor: wordNoMistakeMode === "on" ? "var(--success)" : "var(--border-strong)",
                    position: "relative",
                    transition: "background-color 120ms ease"
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "999px",
                      backgroundColor: "var(--surface)",
                      position: "absolute",
                      top: "3px",
                      left: wordNoMistakeMode === "on" ? "21px" : "3px",
                      transition: "left 120ms ease"
                    }}
                  />
                </span>
              </button>
            </div>

            <div style={{ gridColumn: "1", gridRow: "2" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginBottom: "6px",
                  fontWeight: 600
                }}
              >
                {appText.home.words}
              </div>
              <select
                value={wordsCount}
                onChange={(event) => onWordsCountChange(Number(event.target.value))}
                style={{
                  width: "100%",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  backgroundColor: "var(--input-bg)",
                  color: "var(--text)",
                  fontWeight: 600
                }}
              >
                <option value={10}>10 {appText.home.wordsSuffix}</option>
                <option value={25}>25 {appText.home.wordsSuffix}</option>
                <option value={50}>50 {appText.home.wordsSuffix}</option>
                <option value={75}>75 {appText.home.wordsSuffix}</option>
              </select>
            </div>

            <div style={{ gridColumn: "2", gridRow: "2" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginBottom: "6px",
                  fontWeight: 600
                }}
              >
                {appText.home.difficulty}
              </div>
              <select
                value={wordDifficulty}
                onChange={(event) => onWordDifficultyChange(event.target.value as WordModeDifficulty)}
                style={{
                  width: "100%",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  backgroundColor: "var(--input-bg)",
                  color: "var(--text)",
                  fontWeight: 600
                }}
              >
                <option value="easy">{appText.home.easy}</option>
                <option value="medium">{appText.home.medium}</option>
                <option value="hard">{appText.home.hard}</option>
                <option value="mixed">{appText.home.mixed}</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartWordMode}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              width: "100%",
              backgroundColor: "var(--primary)",
              color: "var(--primary-text)",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {appText.home.startWordMode}
          </button>
        </article>

        <article
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            backgroundColor: "var(--surface)",
            padding: "18px"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>
            {appText.home.customModeTitle}
          </h2>
          <p style={{ marginTop: 0, marginBottom: "14px", color: "var(--muted)", lineHeight: 1.45 }}>
            {appText.home.customModeDescription}
          </p>

          <div
            style={{
              marginBottom: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px"
            }}
          >
            <CustomSelect
              label={appText.home.customLetterFocus}
              value={customSettings.letterFocus}
              options={customLetterFocusOptions}
              onChange={(letterFocus) => patchCustomSettings({ letterFocus })}
            />
            <CustomSelect
              label={appText.home.customCasing}
              value={customSettings.casing}
              options={customCasingOptions}
              onChange={(casing) => patchCustomSettings({ casing })}
            />
            <CustomSelect
              label={appText.home.customPunctuation}
              value={customSettings.punctuation}
              options={levelOptions as Array<HomeSelectOption<CustomPunctuationMode>>}
              onChange={(punctuation) => patchCustomSettings({ punctuation })}
            />
            <CustomSelect
              label={appText.home.customNumbers}
              value={customSettings.numbers}
              options={levelOptions as Array<HomeSelectOption<CustomNumberMode>>}
              onChange={(numbers) => patchCustomSettings({ numbers })}
            />
            <CustomSelect
              label={appText.home.customSymbols}
              value={customSettings.symbols}
              options={levelOptions as Array<HomeSelectOption<CustomSymbolMode>>}
              onChange={(symbols) => patchCustomSettings({ symbols })}
            />
            <CustomSelect
              label={appText.home.customRepeats}
              value={customSettings.repeats}
              options={levelOptions as Array<HomeSelectOption<CustomRepeatMode>>}
              onChange={(repeats) => patchCustomSettings({ repeats })}
            />
            <CustomSelect
              label={appText.home.customRhythm}
              value={customSettings.rhythm}
              options={customRhythmOptions}
              onChange={(rhythm) => patchCustomSettings({ rhythm })}
            />
            <label>
              <div style={controlLabelStyle}>{appText.home.customPinnedWords}</div>
              <input
                value={customSettings.pinnedWords}
                onChange={(event) => patchCustomSettings({ pinnedWords: event.target.value })}
                placeholder={appText.home.customPinnedWordsPlaceholder}
                style={controlFieldStyle}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onStartCustomMode}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              width: "100%",
              backgroundColor: "var(--primary)",
              color: "var(--primary-text)",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {appText.home.startCustomMode}
          </button>
        </article>
      </div>
    </section>
  );
}
