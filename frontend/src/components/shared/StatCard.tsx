import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  trend,
  subtitle,
  loading = false,
}) => {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        },
      }}
    >
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={100}
        >
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            {icon && (
              <Box sx={{ color: color || "#667BC6", opacity: 0.9 }}>{icon}</Box>
            )}
            <Typography
              variant="body2"
              sx={{ color: "#5C6BC0", fontWeight: 500 }}
            >
              {label}
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              color: "#1A237E",
              mb: trend || subtitle ? 1 : 0,
            }}
          >
            {value}
          </Typography>

          {trend && (
            <Typography
              variant="body2"
              sx={{
                color: trend.positive ? "#66BB6A" : "#EF5350",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </Typography>
          )}

          {subtitle && (
            <Typography variant="caption" sx={{ color: "#9E9E9E" }}>
              {subtitle}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default StatCard;
