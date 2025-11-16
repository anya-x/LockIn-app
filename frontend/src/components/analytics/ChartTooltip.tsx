// Custom chart tooltip with detailed information

import React from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  averageValue?: number;
}

export const CustomChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  averageValue,
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0];
  const value = data.value;
  const name = data.name || data.dataKey;

  // Calculate difference from average
  const diffFromAvg = averageValue ? value - averageValue : null;
  const diffPercent = averageValue
    ? ((diffFromAvg! / averageValue) * 100).toFixed(1)
    : null;

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ margin: 0, fontWeight: "bold", marginBottom: "8px" }}>
        {label}
      </p>
      <p style={{ margin: 0, color: data.color }}>
        {name}: <strong>{value}</strong>
      </p>
      {averageValue !== undefined && (
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>
          Average: {averageValue.toFixed(1)}
          {diffFromAvg !== null && (
            <span
              style={{
                marginLeft: "8px",
                color: diffFromAvg > 0 ? "#4CAF50" : "#F44336",
              }}
            >
              ({diffFromAvg > 0 ? "+" : ""}
              {diffPercent}%)
            </span>
          )}
        </p>
      )}
    </div>
  );
};
