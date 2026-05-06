// Small reusable metric tile for typing stats.
// Used by both live runs and completed-run summaries.
import { memo } from "react";
import type { MetricValueAnimationStyle } from "../types";

export const MetricCard = memo(function MetricCard({
  compact = false,
  label,
  metricValueAnimationStyle = "none",
  value
}: {
  compact?: boolean;
  label: string;
  metricValueAnimationStyle?: MetricValueAnimationStyle;
  value: string | number;
}) {
  const textValue = String(value);
  const animateValue = metricValueAnimationStyle !== "none" && /\d/u.test(textValue);

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
      <strong
        className={
          animateValue
            ? `rawtype-metric-value-wrap rawtype-metric-value-${metricValueAnimationStyle}`
            : "rawtype-metric-value-wrap"
        }
        style={{ fontSize: compact ? "16px" : "22px" }}
      >
        <span key={`${label}-${textValue}`} className="rawtype-metric-value">
          {textValue}
        </span>
      </strong>
    </div>
  );
});
