import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EmojiEvents,
  Warning as WarningIcon,
} from "@mui/icons-material";
import api from "../../services/api";

interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  totalTasksCompleted: number;
  totalPomodoros: number;
  totalFocusMinutes: number;
  averageProductivityScore: number;
  averageBurnoutRisk: number;
  bestDay: {
    date: string;
    score: number;
    reason: string;
  } | null;
  worstDay: {
    date: string;
    score: number;
    reason: string;
  } | null;
  productivityTrend: string;
  focusTrend: string;
  recommendations: string[];
}

const WeeklyReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReportData | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get<WeeklyReportData>(
        "/analytics/weekly-report"
      );
      setReport(response.data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report || !report.recommendations) {
    return null;
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING":
        return <TrendingUp color="success" />;
      case "DECLINING":
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="info" />;
    }
  };

  const getTrendColor = (trend: string): "success" | "error" | "default" => {
    switch (trend) {
      case "IMPROVING":
        return "success";
      case "DECLINING":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Weekly Report
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {new Date(report.weekStart).toLocaleDateString()} -{" "}
        {new Date(report.weekEnd).toLocaleDateString()}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Tasks Completed"
                secondary={report.totalTasksCompleted || 0}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Pomodoros Completed"
                secondary={report.totalPomodoros || 0}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Total Focus Time"
                secondary={
                  report.totalFocusMinutes
                    ? `${Math.floor(report.totalFocusMinutes / 60)}h ${
                        report.totalFocusMinutes % 60
                      }m`
                    : "0h 0m"
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Average Productivity"
                secondary={
                  report.averageProductivityScore
                    ? `${report.averageProductivityScore.toFixed(0)}/100`
                    : "0/100"
                }
              />
            </ListItem>
          </List>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Trends
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="body1">Productivity:</Typography>
              {getTrendIcon(report.productivityTrend)}
              <Chip
                label={report.productivityTrend}
                color={getTrendColor(report.productivityTrend)}
                size="small"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body1">Focus Time:</Typography>
              {getTrendIcon(report.focusTrend)}
              <Chip
                label={report.focusTrend}
                color={getTrendColor(report.focusTrend)}
                size="small"
              />
            </Box>
          </Box>
        </Grid>

        {(report.bestDay || report.worstDay) && (
          <>
            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {report.bestDay && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EmojiEvents color="success" />
                  <Typography variant="h6">Best Day</Typography>
                </Box>
                <Typography variant="body1">
                  {new Date(report.bestDay.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Score: {report.bestDay.score.toFixed(0)}/100
                </Typography>
              </Grid>
            )}

            {report.worstDay && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6">Needs Improvement</Typography>
                </Box>
                <Typography variant="body1">
                  {new Date(report.worstDay.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Score: {report.worstDay.score.toFixed(0)}/100
                </Typography>
              </Grid>
            )}
          </>
        )}

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Recommendations
          </Typography>
          <List>
            {report.recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemText primary={`• ${rec}`} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default WeeklyReport;
