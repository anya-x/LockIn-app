import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricName?: string;
  averageValue?: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  metricName = "Value",
  averageValue,
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const value = payload[0].value;
  const formattedDate = new Date(label || "").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const comparisonToAverage =
    averageValue !== undefined && averageValue > 0
      ? ((value - averageValue) / averageValue) * 100
      : null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        {formattedDate}
      </Typography>

      {payload.map((entry, index) => (
        <Box key={index} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
          </Typography>
        </Box>
      ))}

      {comparisonToAverage !== null && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            color: comparisonToAverage >= 0 ? "success.main" : "error.main",
          }}
        >
          {comparisonToAverage >= 0 ? "+" : ""}
          {comparisonToAverage.toFixed(1)}% vs average
        </Typography>
      )}
    </Paper>
  );
};

export default CustomTooltip;
