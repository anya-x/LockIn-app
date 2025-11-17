import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Button,
  IconButton,
  Snackbar,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EmojiEvents,
  Warning as WarningIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import { useQuery } from "@tanstack/react-query";

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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const { data: report, isLoading: loading } = useQuery({
    queryKey: ["analytics", "weekly-report"],
    queryFn: async () => {
      const response = await api.get<WeeklyReportData>(
        "/analytics/weekly-report"
      );
      return response.data;
    },
    staleTime: Infinity,
  });

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

  const generateShareText = () => {
    const weekStart = new Date(report.weekStart).toLocaleDateString();
    const weekEnd = new Date(report.weekEnd).toLocaleDateString();
    const focusTime = report.totalFocusMinutes
      ? `${Math.floor(report.totalFocusMinutes / 60)}h ${report.totalFocusMinutes % 60}m`
      : "0h 0m";

    return `📊 My Weekly Productivity Report (${weekStart} - ${weekEnd})

✅ Tasks Completed: ${report.totalTasksCompleted || 0}
🍅 Pomodoros: ${report.totalPomodoros || 0}
⏱️ Focus Time: ${focusTime}
📈 Avg Productivity: ${report.averageProductivityScore?.toFixed(0) || 0}/100

Trends:
• Productivity: ${report.productivityTrend}
• Focus Time: ${report.focusTrend}

${report.bestDay ? `🏆 Best Day: ${new Date(report.bestDay.date).toLocaleDateString()} (${report.bestDay.score.toFixed(0)}/100)` : ""}

Top Recommendations:
${report.recommendations.slice(0, 3).map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

#Productivity #Focus #LockIn`;
  };

  const handleCopyToClipboard = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text).then(() => {
      setSnackbarMessage("Copied to clipboard!");
      setSnackbarOpen(true);
    });
  };

  const handleDownload = () => {
    const text = generateShareText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weekly-report-${report.weekStart}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSnackbarMessage("Report downloaded!");
    setSnackbarOpen(true);
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Weekly Productivity Report",
          text: text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopyToClipboard();
    }
  };

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {new Date(report.weekStart).toLocaleDateString()} -{" "}
            {new Date(report.weekEnd).toLocaleDateString()}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={handleCopyToClipboard} color="primary" title="Copy to clipboard" size="small">
            <CopyIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleDownload} color="primary" title="Download report" size="small">
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleShare} color="primary" title="Share report" size="small">
            <ShareIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

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
    </Box>
  );
};

export default WeeklyReport;
