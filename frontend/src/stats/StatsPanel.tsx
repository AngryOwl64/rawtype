import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { fetchTypingStats } from "../games/typing/services/runResults";
import type { SavedTypingStats } from "../games/typing/types";

const emptyStats: SavedTypingStats = {
  totalRuns: 0,
  bestWpm: 0,
  bestCpm: 0,
  averageWpm: 0,
  averageCpm: 0,
  averageAccuracy: 0,
  totalDurationMs: 0,
  totalTypedChars: 0,
  totalMistakes: 0,
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

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid var(--border-soft)", borderRadius: "8px", padding: "12px" }}>
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "4px" }}>{label}</div>
      <strong style={{ fontSize: "24px" }}>{value}</strong>
    </div>
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
            <StatTile label="Average WPM" value={stats.averageWpm} />
            <StatTile label="Average CPM" value={stats.averageCpm} />
            <StatTile label="Accuracy" value={`${stats.averageAccuracy}%`} />
            <StatTile label="Practice Time" value={formatDuration(stats.totalDurationMs)} />
            <StatTile label="Mistakes" value={stats.totalMistakes} />
          </div>

          <section>
            <h2 style={{ fontSize: "20px", margin: "0 0 10px" }}>Recent Runs</h2>
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
          </section>

          <section>
            <h2 style={{ fontSize: "20px", margin: "0 0 10px" }}>Worst Words</h2>
            {stats.worstWords.length === 0 && (
              <p style={{ margin: 0, color: "var(--muted)" }}>No recurring mistakes yet.</p>
            )}
            {stats.worstWords.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {stats.worstWords.map((entry) => (
                  <span
                    key={entry.word}
                    style={{
                      border: "1px solid var(--border-soft)",
                      borderRadius: "999px",
                      padding: "6px 10px",
                      backgroundColor: "var(--surface-soft)",
                      fontWeight: 700
                    }}
                  >
                    {entry.word} ({entry.mistakes})
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
