import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { fetchTypingStats } from "../games/typing/services/runResults";
import type { SavedTypingStats } from "../games/typing/types";

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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatTrend(value: number): string {
  if (value === 0) return "No change";
  return value > 0 ? `${value} WPM faster` : `${Math.abs(value)} WPM slower`;
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
  averageWpm
}: {
  runs: SavedTypingStats["wpmHistory"];
  averageWpm: number;
}) {
  const buckets = buildWpmRangeBuckets(runs);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  if (runs.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>No WPM data yet.</p>;
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
        <span style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700 }}>Average WPM</span>
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

export function DailyActivityChart({ days }: { days: SavedTypingStats["dailyActivity"] }) {
  const maxRuns = Math.max(1, ...days.map((day) => day.runs));

  if (days.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>No daily activity yet.</p>;
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
          <span style={{ color: "var(--muted)", fontSize: "12px" }}>{formatDay(day.date)}</span>
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
            {day.runs} {day.runs === 1 ? "run" : "runs"}
          </strong>
        </div>
      ))}
    </div>
  );
}

function WorstWordsChart({ words }: { words: SavedTypingStats["worstWords"] }) {
  const maxMistakes = Math.max(1, ...words.map((entry) => entry.mistakes));

  if (words.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>No recurring mistakes yet.</p>;
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
            {entry.mistakes} {entry.mistakes === 1 ? "error" : "errors"}
          </span>
        </div>
      ))}
    </div>
  );
}

function ModeBreakdown({ modes }: { modes: SavedTypingStats["modeStats"] }) {
  if (modes.length === 0) {
    return <p style={{ margin: 0, color: "var(--muted)" }}>No mode data yet.</p>;
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
          <strong>{mode.mode === "words" ? "Word Mode" : "Sentences"}</strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "10px"
            }}
          >
            <RunMetric label="Runs" value={mode.runs} />
            <RunMetric label="Best WPM" value={mode.bestWpm} />
            <RunMetric label="Avg WPM" value={mode.averageWpm} />
            <RunMetric label="Accuracy" value={`${mode.averageAccuracy}%`} />
            <RunMetric label="Error-Free" value={mode.cleanRuns} />
            <RunMetric label="Time" value={formatDuration(mode.totalDurationMs)} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function StatsPanel() {
  const { configured, loading: authLoading, user } = useAuth();
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
          setError(statsError instanceof Error ? statsError.message : "Could not load stats.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, configured, user]);

  if (!configured) {
    return (
      <section style={{ border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--surface)", padding: "20px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>Stats</h1>
        <p style={{ margin: 0, color: "var(--danger)" }}>Supabase is not configured.</p>
      </section>
    );
  }

  if (authLoading) {
    return (
      <section style={{ border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--surface)", padding: "20px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>Stats</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>Loading account...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section style={{ border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--surface)", padding: "20px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>Stats</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>Login to save runs and build your typing history.</p>
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
        <h1 style={{ margin: 0, fontSize: "32px" }}>Stats</h1>
        {loading && <span style={{ color: "var(--muted)", fontSize: "13px" }}>Loading...</span>}
      </div>

      {error && <p style={{ marginBottom: 0, color: "var(--danger)" }}>{error}</p>}

      {!error && stats.totalRuns === 0 && !loading && (
        <p style={{ marginBottom: 0, color: "var(--muted)" }}>No saved runs yet. Finish a run while logged in.</p>
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
            <StatTile label="Runs" value={stats.totalRuns} />
            <StatTile label="Best WPM" value={stats.bestWpm} />
            <StatTile label="Best CPM" value={stats.bestCpm} />
            <StatTile label="Best Accuracy" value={`${stats.bestAccuracy}%`} />
            <StatTile label="Average WPM" value={stats.averageWpm} />
            <StatTile label="Average CPM" value={stats.averageCpm} />
            <StatTile label="Accuracy" value={`${stats.averageAccuracy}%`} />
            <StatTile label="Practice Time" value={formatDuration(stats.totalDurationMs)} />
            <StatTile label="Mistakes" value={stats.totalMistakes} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px"
            }}
          >
            <StatTile label="Last 5 Avg" value={`${stats.lastFiveAverageWpm} WPM`} />
            <StatTile label="Recent Speed" value={formatTrend(stats.wpmTrend)} />
            <StatTile label="Streak" value={`${stats.currentStreakDays}d`} />
            <StatTile label="Error-Free Runs" value={`${stats.cleanRuns} (${stats.cleanRunRate}%)`} />
            <StatTile label="Failed Runs" value={stats.failedRuns} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            <SectionCard title="Average WPM">
              <AverageWpmRangeChart runs={stats.wpmHistory} averageWpm={stats.averageWpm} />
            </SectionCard>

            <SectionCard title="Daily Activity">
              <DailyActivityChart days={stats.dailyActivity} />
            </SectionCard>
          </div>

          <SectionCard title="Mode Breakdown">
            <ModeBreakdown modes={stats.modeStats} />
          </SectionCard>

          <SectionCard title="Worst Words">
            <WorstWordsChart words={stats.worstWords} />
          </SectionCard>

          <SectionCard title="Recent Runs">
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
                    <strong>{run.mode === "words" ? "Word Mode" : "Sentences"}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "12px" }}>{formatDate(run.created_at)}</div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, minmax(72px, 1fr))",
                      gap: "10px",
                      flex: "3 1 430px"
                    }}
                  >
                    <RunMetric label="WPM" value={run.wpm} />
                    <RunMetric label="CPM" value={run.cpm} />
                    <RunMetric label="Accuracy" value={`${run.accuracy}%`} />
                    <RunMetric label="Errors" value={run.mistakes} />
                    <RunMetric label="Words" value={`${run.completed_words}/${run.total_words}`} />
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
