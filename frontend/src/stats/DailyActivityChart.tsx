import { useEffect, useRef, useState } from "react";
import type { SavedTypingStats, TypingLanguage } from "../games/typing/types";
import { getLocaleForLanguage } from "../i18n/language";
import { getStatsTexts } from "../i18n/messages";

function formatDay(value: string, locale: string, compact: boolean): string {
  return new Intl.DateTimeFormat(
    locale,
    compact
      ? {
          month: "numeric",
          day: "numeric"
        }
      : {
          month: "short",
          day: "numeric"
        }
  ).format(new Date(`${value}T00:00:00`));
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
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const updateCompactLayout = () => {
      setCompact(chart.clientWidth < 360);
    };

    updateCompactLayout();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        updateCompactLayout();
      });
      resizeObserver.observe(chart);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", updateCompactLayout);
    return () => window.removeEventListener("resize", updateCompactLayout);
  }, []);

  if (days.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>{text.noDailyActivity}</p>;
  }

  return (
    <div ref={chartRef} style={{ display: "grid", gap: compact ? "6px" : "8px" }}>
      {days.map((day) => (
        <div
          key={day.date}
          style={{
            display: "grid",
            gridTemplateColumns: compact ? "minmax(48px, auto) minmax(0, 1fr) max-content" : "minmax(70px, auto) minmax(80px, 1fr) max-content",
            gap: compact ? "8px" : "10px",
            alignItems: "center"
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: compact ? "11px" : "12px", whiteSpace: "nowrap" }}>
            {formatDay(day.date, locale, compact)}
          </span>
          <div
            style={{
              height: compact ? "8px" : "10px",
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
          <strong style={{ fontSize: compact ? "11px" : "12px", whiteSpace: "nowrap" }}>
            {day.runs} {day.runs === 1 ? text.run : text.runs}
          </strong>
        </div>
      ))}
    </div>
  );
}
