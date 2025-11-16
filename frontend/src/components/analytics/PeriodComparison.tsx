import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  CheckCircle,
  Timer,
  Speed,
  WarningAmber,
} from "@mui/icons-material";
import { useComparisonAnalytics } from "../../hooks/useAnalytics";

type PeriodType = "week" | "month" | "custom";

const PeriodComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("week");

  // Calculate date ranges based on selected period
  const getDateRanges = () => {
    const today = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (period === "week") {
      // Current week (last 7 days)
      currentEnd = new Date(today);
      currentStart = new Date(today);
      currentStart.setDate(currentStart.getDate() - 6);

      // Previous week (7 days before that)
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 6);
    } else {
      // Month (last 30 days)
      currentEnd = new Date(today);
      currentStart = new Date(today);
      currentStart.setDate(currentStart.getDate() - 29);

      // Previous month (30 days before that)
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 29);
    }

    return {
      currentStart: currentStart.toISOString().split("T")[0],
      currentEnd: currentEnd.toISOString().split("T")[0],
      previousStart: previousStart.toISOString().split("T")[0],
      previousEnd: previousEnd.toISOString().split("T")[0],
    };
  };

  const dateRanges = getDateRanges();

  const { data, isLoading, error } = useComparisonAnalytics(
    dateRanges.currentStart,
    dateRanges.currentEnd,
    dateRanges.previousStart,
    dateRanges.previousEnd
  );

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp color="success" />;
      case "down":
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable", inverse = false) => {
    if (trend === "stable") return "default";
    const isPositive = inverse ? trend === "down" : trend === "up";
    return isPositive ? "success" : "error";
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Period Comparison
        </Typography>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Period Comparison
        </Typography>
        <Alert severity="error">Failed to load comparison data</Alert>
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Period Comparison</Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, newPeriod) => {
            if (newPeriod) setPeriod(newPeriod);
          }}
          size="small"
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Comparing {period === "week" ? "last 7 days" : "last 30 days"} vs{" "}
        {period === "week" ? "previous 7 days" : "previous 30 days"}
      </Typography>

      <Grid container spacing={3}>
        {/* Tasks Completed */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircle color="success" />
                <Typography variant="subtitle2">Tasks Completed</Typography>
              </Box>
              <Typography variant="h3">{data.current.tasksCompleted}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                vs {data.previous.tasksCompleted} before
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {getTrendIcon(data.tasksTrend)}
                <Chip
                  label={formatChange(data.tasksChange)}
                  color={getTrendColor(data.tasksTrend)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Productivity Score */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Speed color="info" />
                <Typography variant="subtitle2">Productivity Score</Typography>
              </Box>
              <Typography variant="h3">
                {data.current.productivityScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                vs {data.previous.productivityScore.toFixed(0)} before
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {getTrendIcon(data.productivityTrend)}
                <Chip
                  label={formatChange(data.productivityChange)}
                  color={getTrendColor(data.productivityTrend)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Time */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Timer color="primary" />
                <Typography variant="subtitle2">Focus Time</Typography>
              </Box>
              <Typography variant="h3">
                {Math.floor(data.current.focusMinutes / 60)}h{" "}
                {data.current.focusMinutes % 60}m
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                vs {Math.floor(data.previous.focusMinutes / 60)}h{" "}
                {data.previous.focusMinutes % 60}m before
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {getTrendIcon(data.focusTrend)}
                <Chip
                  label={formatChange(data.focusChange)}
                  color={getTrendColor(data.focusTrend)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Burnout Risk */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WarningAmber color="warning" />
                <Typography variant="subtitle2">Burnout Risk</Typography>
              </Box>
              <Typography variant="h3">
                {data.current.burnoutRiskScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                vs {data.previous.burnoutRiskScore.toFixed(0)} before
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {getTrendIcon(data.burnoutTrend)}
                <Chip
                  label={formatChange(data.burnoutChange)}
                  color={getTrendColor(data.burnoutTrend, true)} // Inverse: down is good
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PeriodComparison;
