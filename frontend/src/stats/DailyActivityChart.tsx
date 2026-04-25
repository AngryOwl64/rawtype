import type { SavedTypingStats, TypingLanguage } from "../games/typing/types";
import { getLocaleForLanguage } from "../i18n/language";
import { getStatsTexts } from "../i18n/messages";

function formatDay(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function DailyActivityChart({
  days,
  language = "en"
}: {
  days: SavedTypingStats["dailyActivity"];
  language?: TypingLanguage;
}) {
  const text = getStatsTexts(language);
  const locale = getLocaleForLanguage(language);
  const maxRuns = Math.max(1, ...days.map((day) => day.runs));

  if (days.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>{text.noDailyActivity}</p>;
  }

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {days.map((day) => (
        <div
          key={day.date}
          style={{
            display: "grid",
            gridTemplateColumns: "70px minmax(80px, 1fr) 82px",
            gap: "10px",
            alignItems: "center"
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: "12px" }}>{formatDay(day.date, locale)}</span>
          <div
            style={{
              height: "10px",
              borderRadius: "999px",
              backgroundColor: "var(--input-muted)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${Math.max(8, Math.round((day.runs / maxRuns) * 100))}%`,
                height: "100%",
                backgroundColor: "var(--success)"
              }}
            />
          </div>
          <strong style={{ fontSize: "12px" }}>
            {day.runs} {day.runs === 1 ? text.run : text.runs}
          </strong>
        </div>
      ))}
    </div>
  );
}
