// Stats dashboard for saved typing runs and daily activity.
// Formats Supabase results into charts, tiles, and recent-run summaries.
import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { fetchTypingStats } from "../games/typing/services/runResults";
import type { SavedTypingStats, TypingLanguage } from "../games/typing/types";
import { getLocaleForLanguage } from "../i18n/language";
import { getStatsTexts } from "../i18n/messages";
import { DailyActivityChart } from "./DailyActivityChart";

const emptyStats: SavedTypingStats = {
  totalRuns: 0,
  bestWpm: 0,
  bestCpm: 0,
  bestAccuracy: 0,
  averageWpm: 0,
  averageCpm: 0,
  averageAccuracy: 0,
  cleanRuns: 0,
  cleanRunRate: 0,
  failedRuns: 0,
  currentStreakDays: 0,
  lastFiveAverageWpm: 0,
  previousFiveAverageWpm: 0,
  wpmTrend: 0,
  totalDurationMs: 0,
  totalTypedChars: 0,
  totalMistakes: 0,
  modeStats: [],
  dailyActivity: [],
  wpmHistory: [],
  recentRuns: [],
  worstWords: []
};

function formatDuration(totalMs: number): string {
  const totalSeconds = Math.round(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTrend(value: number, text: ReturnType<typeof getStatsTexts>): string {
  if (value === 0) return text.noChange;
  return value > 0 ? `${value} ${text.fasterSuffix}` : `${Math.abs(value)} ${text.slowerSuffix}`;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid var(--border-soft)", borderRadius: "8px", padding: "12px" }}>
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "4px" }}>{label}</div>
      <strong style={{ fontSize: "24px" }}>{value}</strong>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: "8px",
        padding: "14px",
        display: "grid",
        gap: "12px"
      }}
    >
      <h2 style={{ fontSize: "20px", margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

function RunMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        minWidth: "72px"
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "2px" }}>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

type WpmRangeBucket = {
  label: string;
  count: number;
};

function buildWpmRangeBuckets(runs: SavedTypingStats["wpmHistory"]): WpmRangeBucket[] {
  if (runs.length === 0) return [];

  const values = runs.map((run) => run.wpm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const start = Math.floor(min / 10) * 10;
  const end = Math.ceil(max / 10) * 10 + 10;
  const buckets: WpmRangeBucket[] = [];

  for (let rangeStart = start; rangeStart < end; rangeStart += 10) {
    const rangeEnd = rangeStart + 10;
    const count = values.filter((value) => value >= rangeStart && value < rangeEnd).length;

    if (count > 0) {
      buckets.push({
        label: `${rangeStart}-${rangeEnd}`,
        count
      });
    }
  }

  return buckets;
}

function AverageWpmRangeChart({
  runs,
  averageWpm,
  language
}: {
  runs: SavedTypingStats["wpmHistory"];
  averageWpm: number;
  language: TypingLanguage;
}) {
  const text = getStatsTexts(language);
  const buckets = buildWpmRangeBuckets(runs);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  if (runs.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>{text.noWpmData}</p>;
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      <div
        style={{
          border: "1px solid var(--border-soft)",
          borderRadius: "8px",
          padding: "10px 12px",
          backgroundColor: "var(--surface-soft)"
        }}
      >
        <span style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700 }}>{text.averageWpm}</span>
        <strong style={{ display: "block", fontSize: "26px" }}>{averageWpm}</strong>
      </div>

      <div
        style={{
          minHeight: "170px",
          display: "grid",
          gridTemplateColumns: `repeat(${buckets.length}, minmax(42px, 1fr))`,
          gap: "8px",
          alignItems: "end"
        }}
      >
        {buckets.map((bucket) => {
          const height = Math.max(16, Math.round((bucket.count / maxCount) * 130));

          return (
            <div key={bucket.label} title={`${bucket.label}: ${bucket.count} runs`}>
              <div
                style={{
                  height: `${height}px`,
                  borderRadius: "6px 6px 3px 3px",
                  backgroundColor: "var(--primary)"
                }}
              />
              <div style={{ marginTop: "6px", color: "var(--muted)", fontSize: "11px", textAlign: "center" }}>
                {bucket.label}
              </div>
              <div style={{ color: "var(--muted-strong)", fontSize: "11px", textAlign: "center", fontWeight: 700 }}>
                {bucket.count}x
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorstWordsChart({ words, language }: { words: SavedTypingStats["worstWords"]; language: TypingLanguage }) {
  const text = getStatsTexts(language);
  const maxMistakes = Math.max(1, ...words.map((entry) => entry.mistakes));

  if (words.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>{text.noRecurringMistakes}</p>;
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {words.map((entry, index) => (
        <div
          key={entry.word}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(90px, 140px) minmax(110px, 1fr) 68px",
            gap: "10px",
            alignItems: "center"
          }}
        >
          <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {index + 1}. {entry.word}
          </strong>
          <div
            style={{
              height: "14px",
              borderRadius: "999px",
              backgroundColor: "var(--input-muted)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${Math.max(10, Math.round((entry.mistakes / maxMistakes) * 100))}%`,
                height: "100%",
                backgroundColor: "var(--danger)"
              }}
            />
          </div>
          <span style={{ color: "var(--muted-strong)", fontSize: "13px", fontWeight: 700 }}>
            {entry.mistakes} {entry.mistakes === 1 ? text.errorSingular : text.errorPlural}
          </span>
        </div>
      ))}
    </div>
  );
}

function ModeBreakdown({ modes, language }: { modes: SavedTypingStats["modeStats"]; language: TypingLanguage }) {
  const text = getStatsTexts(language);

  if (modes.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>{text.noModeData}</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
      {modes.map((mode) => (
        <article
          key={mode.mode}
          style={{
            border: "1px solid var(--border-soft)",
            borderRadius: "8px",
            padding: "12px",
            backgroundColor: "var(--surface-soft)"
          }}
        >
          <strong>{mode.mode === "words" ? text.modeWords : text.modeSentences}</strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "10px"
            }}
          >
            <RunMetric label={text.runsLabel} value={mode.runs} />
            <RunMetric label={text.bestWpmLabel} value={mode.bestWpm} />
            <RunMetric label={text.avgWpmLabel} value={mode.averageWpm} />
            <RunMetric label={text.accuracyLabel} value={`${mode.averageAccuracy}%`} />
            <RunMetric label={text.errorFreeLabel} value={mode.cleanRuns} />
            <RunMetric label={text.timeLabel} value={formatDuration(mode.totalDurationMs)} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function StatsPanel({ language = "en" }: { language?: TypingLanguage }) {
  const { configured, loading: authLoading, user } = useAuth();
  const text = getStatsTexts(language);
  const locale = getLocaleForLanguage(language);
  const [stats, setStats] = useState<SavedTypingStats>(emptyStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured || authLoading || !user) {
      return;
    }

    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError("");
        return fetchTypingStats();
      })
      .then((nextStats) => {
        if (active && nextStats) setStats(nextStats);
      })
      .catch((statsError: unknown) => {
        if (active) {
          setError(statsError instanceof Error ? statsError.message : text.couldNotLoad);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, configured, user, text.couldNotLoad]);

  if (!configured) {
    return (
      <section style={{ border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--surface)", padding: "20px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>{text.title}</h1>
        <p style={{ margin: 0, color: "var(--danger)" }}>{text.supabaseNotConfigured}</p>
      </section>
    );
  }

  if (authLoading) {
    return (
      <section style={{ border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--surface)", padding: "20px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>{text.title}</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>{text.loadingAccount}</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section style={{ border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--surface)", padding: "20px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>{text.title}</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>{text.loginPrompt}</p>
      </section>
    );
  }

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        backgroundColor: "var(--surface)",
        padding: "20px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
        <h1 style={{ margin: 0, fontSize: "32px" }}>{text.title}</h1>
        {loading && <span style={{ color: "var(--muted)", fontSize: "13px" }}>{text.loading}</span>}
      </div>

      {error && <p style={{ marginBottom: 0, color: "var(--danger)" }}>{error}</p>}

      {!error && stats.totalRuns === 0 && !loading && (
        <p style={{ marginBottom: 0, color: "var(--muted)" }}>{text.noSavedRuns}</p>
      )}

      {stats.totalRuns > 0 && (
        <div style={{ display: "grid", gap: "18px", marginTop: "18px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px"
            }}
          >
            <StatTile label={text.runsLabel} value={stats.totalRuns} />
            <StatTile label={text.bestWpmLabel} value={stats.bestWpm} />
            <StatTile label={text.bestCpm} value={stats.bestCpm} />
            <StatTile label={text.bestAccuracy} value={`${stats.bestAccuracy}%`} />
            <StatTile label={text.averageWpm} value={stats.averageWpm} />
            <StatTile label={text.averageCpm} value={stats.averageCpm} />
            <StatTile label={text.accuracyLabel} value={`${stats.averageAccuracy}%`} />
            <StatTile label={text.practiceTime} value={formatDuration(stats.totalDurationMs)} />
            <StatTile label={text.mistakes} value={stats.totalMistakes} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px"
            }}
          >
            <StatTile label={text.last5Avg} value={`${stats.lastFiveAverageWpm} WPM`} />
            <StatTile label={text.recentSpeed} value={formatTrend(stats.wpmTrend, text)} />
            <StatTile label={text.streak} value={`${stats.currentStreakDays}d`} />
            <StatTile label={text.errorFreeRuns} value={`${stats.cleanRuns} (${stats.cleanRunRate}%)`} />
            <StatTile label={text.failedRuns} value={stats.failedRuns} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            <SectionCard title={text.averageWpm}>
              <AverageWpmRangeChart runs={stats.wpmHistory} averageWpm={stats.averageWpm} language={language} />
            </SectionCard>

            <SectionCard title={text.dailyActivity}>
              <DailyActivityChart days={stats.dailyActivity} language={language} />
            </SectionCard>
          </div>

          <SectionCard title={text.modeBreakdown}>
            <ModeBreakdown modes={stats.modeStats} language={language} />
          </SectionCard>

          <SectionCard title={text.worstWords}>
            <WorstWordsChart words={stats.worstWords} language={language} />
          </SectionCard>

          <SectionCard title={text.recentRuns}>
            <div style={{ display: "grid", gap: "8px" }}>
              {stats.recentRuns.map((run) => (
                <article
                  key={run.id}
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: "8px",
                    padding: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center"
                  }}
                >
                  <div style={{ minWidth: "150px", flex: "1 1 180px" }}>
                    <strong>{run.mode === "words" ? text.modeWords : text.modeSentences}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "12px" }}>{formatDate(run.created_at, locale)}</div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, minmax(72px, 1fr))",
                      gap: "10px",
                      flex: "3 1 430px"
                    }}
                  >
                    <RunMetric label={text.wpm} value={run.wpm} />
                    <RunMetric label={text.cpm} value={run.cpm} />
                    <RunMetric label={text.accuracyLabel} value={`${run.accuracy}%`} />
                    <RunMetric label={text.errors} value={run.mistakes} />
                    <RunMetric label={text.words} value={`${run.completed_words}/${run.total_words}`} />
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </section>
  );
}
