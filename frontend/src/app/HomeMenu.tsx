import type { getAppTexts } from "../i18n/messages";
import { DailyActivityChart } from "../stats/StatsPanel";
import type { SavedTypingDayStats, TypingLanguage, WordModeDifficulty, WordNoMistakeMode } from "../games/typing/types";

type AppTexts = ReturnType<typeof getAppTexts>;

type HomeMenuProps = {
  appText: AppTexts;
  currentStreakDays: number;
  dailyActivity: SavedTypingDayStats[];
  language: TypingLanguage;
  signedIn: boolean;
  wordDifficulty: WordModeDifficulty;
  wordNoMistakeMode: WordNoMistakeMode;
  wordsCount: number;
  onStartClassic: () => void;
  onStartWordMode: () => void;
  onWordDifficultyChange: (difficulty: WordModeDifficulty) => void;
  onWordNoMistakeModeChange: (mode: WordNoMistakeMode) => void;
  onWordsCountChange: (count: number) => void;
};

export default function HomeMenu({
  appText,
  currentStreakDays,
  dailyActivity,
  language,
  signedIn,
  wordDifficulty,
  wordNoMistakeMode,
  wordsCount,
  onStartClassic,
  onStartWordMode,
  onWordDifficultyChange,
  onWordNoMistakeModeChange,
  onWordsCountChange
}: HomeMenuProps) {
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
      </div>
    </section>
  );
}
