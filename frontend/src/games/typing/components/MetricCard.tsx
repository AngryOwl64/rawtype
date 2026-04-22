import { memo } from "react";

export const MetricCard = memo(function MetricCard({
  compact = false,
  label,
  value
}: {
  compact?: boolean;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: "8px",
        padding: "10px",
        minHeight: compact ? "58px" : "66px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "4px" }}>{label}</div>
      <strong style={{ fontSize: compact ? "16px" : "22px" }}>{value}</strong>
    </div>
  );
});
