import React from "react";
import { Box, Chip, Skeleton, useTheme, alpha } from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  TrendingUp,
} from "@mui/icons-material";

interface StatPillsProps {
  stats: {
    totalTasks: number;
    todoCount: number;
    inProgressCount: number;
    completedCount: number;
  };
  loading?: boolean;
}

const StatPills: React.FC<StatPillsProps> = ({ stats, loading = false }) => {
  const theme = useTheme();

  const pills = [
    {
      label: "Total",
      value: stats.totalTasks,
      icon: <Schedule sx={{ fontSize: 16 }} />,
      color: theme.palette.primary.main,
    },
    {
      label: "To Do",
      value: stats.todoCount,
      icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} />,
      color: theme.palette.text.secondary,
    },
    {
      label: "In Progress",
      value: stats.inProgressCount,
      icon: <TrendingUp sx={{ fontSize: 16 }} />,
      color: theme.palette.warning.main,
    },
    {
      label: "Done",
      value: stats.completedCount,
      icon: <CheckCircle sx={{ fontSize: 16 }} />,
      color: theme.palette.success.main,
    },
  ];

  if (loading) {
    return (
      <Box display="flex" gap={1} flexWrap="wrap">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width={90}
            height={32}
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box display="flex" gap={1} flexWrap="wrap">
      {pills.map((pill) => (
        <Chip
          key={pill.label}
          icon={pill.icon}
          label={`${pill.value} ${pill.label}`}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "0.8rem",
            bgcolor: alpha(pill.color, 0.1),
            color: pill.color,
            border: `1px solid ${alpha(pill.color, 0.2)}`,
            "& .MuiChip-icon": {
              color: pill.color,
            },
          }}
        />
      ))}
    </Box>
  );
};

export default StatPills;
