import React from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  CalendarToday,
  Schedule,
  Timer as TimerIcon,
  CheckCircle,
} from "@mui/icons-material";
import { useProductivityInsights } from "../../hooks/useAnalytics";

const ProductivityInsights: React.FC = () => {
  const { data: insights, isLoading } = useProductivityInsights();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!insights || insights.totalDaysAnalyzed === 0) {
    return (
      <Box>
        <Typography color="text.secondary">
          Not enough data yet. Keep working to see your insights!
        </Typography>
      </Box>
    );
  }

  const formatDayOfWeek = (day: string) => {
    const days: { [key: string]: string } = {
      MONDAY: "Monday",
      TUESDAY: "Tuesday",
      WEDNESDAY: "Wednesday",
      THURSDAY: "Thursday",
      FRIDAY: "Friday",
      SATURDAY: "Saturday",
      SUNDAY: "Sunday",
    };
    return days[day] || day;
  };

  const formatTimeOfDay = (time: string) => {
    const times: { [key: string]: string } = {
      morning: "Morning (6am-12pm)",
      afternoon: "Afternoon (12pm-6pm)",
      evening: "Evening (6pm-12am)",
      night: "Night (12am-6am)",
    };
    return times[time] || time;
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Based on statistical analysis of the last {insights.totalDaysAnalyzed}{" "}
        days
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarToday color="primary" sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Most Productive Day
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatDayOfWeek(insights.mostProductiveDay)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Schedule color="primary" sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Best Time of Day
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatTimeOfDay(insights.bestTimeOfDay)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TimerIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Avg Session Length
                </Typography>
              </Box>
              <Typography variant="h6">
                {insights.averageSessionLength} min
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="primary" sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Completion Rate Trend
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Typography variant="h6" sx={{ mr: 1 }}>
                  {insights.completionRateTrend > 0 ? "+" : ""}
                  {insights.completionRateTrend.toFixed(1)}%
                </Typography>
                {insights.completionRateTrend > 0 ? (
                  <Chip
                    icon={<TrendingUp />}
                    label="Improving"
                    color="success"
                    size="small"
                  />
                ) : insights.completionRateTrend < -5 ? (
                  <Chip
                    icon={<TrendingDown />}
                    label="Declining"
                    color="error"
                    size="small"
                  />
                ) : (
                  <Chip label="Stable" size="small" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductivityInsights;
