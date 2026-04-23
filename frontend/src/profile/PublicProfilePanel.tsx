// Public profile view for usernames exposed at /{username}.
// Loads only public typing stats and avoids private account details.
import { useEffect, useMemo, useState } from "react";
import { fetchPublicTypingStatsByUsername } from "../games/typing/services/runResults";
import type { SavedTypingStats, TypingLanguage } from "../games/typing/types";
import { getStatsTexts, translateAccountText } from "../i18n/messages";
import { isSupabaseConfigured } from "../lib/supabase";

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

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid var(--border-soft)", borderRadius: "8px", padding: "12px" }}>
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "4px" }}>{label}</div>
      <strong style={{ fontSize: "24px" }}>{value}</strong>
    </div>
  );
}

export default function PublicProfilePanel({
  username,
  language = "en"
}: {
  username: string;
  language?: TypingLanguage;
}) {
  const text = getStatsTexts(language);
  const [loading, setLoading] = useState(() => isSupabaseConfigured);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<SavedTypingStats>(emptyStats);
  const [notFound, setNotFound] = useState(false);
  const normalizedUsername = useMemo(() => username.trim().toLowerCase(), [username]);
  const profileNotFoundText = translateAccountText(language, "This public profile does not exist or is private.");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError("");
        setNotFound(false);
        return fetchPublicTypingStatsByUsername(normalizedUsername);
      })
      .then((nextStats) => {
        if (!active || !nextStats) {
          if (active) {
            setNotFound(true);
            setStats(emptyStats);
          }
          return;
        }

        setStats(nextStats);
      })
      .catch((statsError: unknown) => {
        if (!active) return;
        setError(statsError instanceof Error ? statsError.message : text.couldNotLoad);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [normalizedUsername, text.couldNotLoad]);

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        backgroundColor: "var(--surface)",
        padding: "20px"
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "32px" }}>@{normalizedUsername}</h1>

      {!isSupabaseConfigured && <p style={{ margin: 0, color: "var(--danger)" }}>{text.supabaseNotConfigured}</p>}

      {isSupabaseConfigured && loading && <p style={{ margin: 0, color: "var(--muted)" }}>{text.loading}</p>}

      {isSupabaseConfigured && !loading && error && <p style={{ margin: 0, color: "var(--danger)" }}>{error}</p>}

      {isSupabaseConfigured && !loading && !error && notFound && (
        <p style={{ margin: 0, color: "var(--muted)" }}>{profileNotFoundText}</p>
      )}

      {isSupabaseConfigured && !loading && !error && !notFound && (
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
            <StatTile label={text.averageWpm} value={stats.averageWpm} />
            <StatTile label={text.accuracyLabel} value={`${stats.averageAccuracy}%`} />
            <StatTile label={text.streak} value={`${stats.currentStreakDays}d`} />
            <StatTile label={text.practiceTime} value={formatDuration(stats.totalDurationMs)} />
          </div>

          {stats.totalRuns === 0 && <p style={{ margin: 0, color: "var(--muted)" }}>{text.noSavedRuns}</p>}
        </div>
      )}
    </section>
  );
}
