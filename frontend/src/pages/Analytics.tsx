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
  Button,
  Chip,
} from "@mui/material";
import {
  TrendingUp,
  CheckCircle,
  Timer,
  EmojiEvents,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import BurnoutAlert from "../components/analytics/BurnOutAlert";
import WeeklyReport from "../components/analytics/WeeklyReport";
import { useTimer } from "../context/TimerContext";
import {
  useAnalyticsRange,
  useRefreshAnalytics,
  useTodayAnalytics,
} from "../hooks/useAnalytics";
import PeriodComparison from "../components/analytics/PeriodComparison";

const AnalyticsPage: React.FC = () => {
  const { timer } = useTimer();

  const {
    data: todayAnalytics,
    isLoading: todayLoading,
    error: todayError,
  } = useTodayAnalytics();

  const { data: rangeData = [], isLoading: rangeLoading } =
    useAnalyticsRange(7);

  const refreshAnalytics = useRefreshAnalytics();

  const loading = todayLoading || rangeLoading;
  const error = todayError ? "Failed to load analytics data" : null;

  React.useEffect(() => {
    if (timer.completionCounter > 0) {
      refreshAnalytics();
    }
  }, [timer.completionCounter, refreshAnalytics]);

  const handleRefresh = async () => {
    await refreshAnalytics();
  };

  if (loading && !todayAnalytics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !todayAnalytics) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!todayAnalytics) {
    return (
      <Box p={3}>
        <Alert severity="info">No analytics data available yet</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Burnout Alert */}
      {todayAnalytics.burnoutRiskScore > 0 && (
        <BurnoutAlert
          riskScore={todayAnalytics.burnoutRiskScore}
          lateNightSessions={todayAnalytics.lateNightSessions}
          overworkMinutes={todayAnalytics.overworkMinutes}
        />
      )}
      <PeriodComparison />
      {/* Today's Stats */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Today's Performance
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircle color="success" />
                <Typography variant="subtitle2">Tasks Completed</Typography>
              </Box>
              <Typography variant="h3">
                {todayAnalytics.tasksCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {todayAnalytics.tasksCompletedFromToday} from today's {todayAnalytics.tasksCreated}
              </Typography>
              {todayAnalytics.tasksCreated > 0 && (
                <Chip
                  label={`${todayAnalytics.completionRate.toFixed(0)}% daily completion`}
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
              {todayAnalytics.tasksCompleted > todayAnalytics.tasksCompletedFromToday && (
                <Typography
                  variant="caption"
                  color="info.main"
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  +{todayAnalytics.tasksCompleted - todayAnalytics.tasksCompletedFromToday} from backlog
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Timer color="primary" />
                <Typography variant="subtitle2">Sessions</Typography>
              </Box>
              <Typography variant="h3">
                {todayAnalytics.pomodorosCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.floor(todayAnalytics.focusMinutes / 60)}h{" "}
                {todayAnalytics.focusMinutes % 60}m focused
              </Typography>
              {todayAnalytics.interruptedSessions > 0 && (
                <Typography
                  variant="caption"
                  color="warning.main"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  {todayAnalytics.interruptedSessions} interrupted
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="info" />
                <Typography variant="subtitle2">Productivity</Typography>
              </Box>
              <Typography variant="h3">
                {todayAnalytics.productivityScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                out of 100
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Based on completion rate & focus time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmojiEvents color="warning" />
                <Typography variant="subtitle2">Focus Score</Typography>
              </Box>
              <Typography variant="h3">
                {todayAnalytics.focusScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                out of 100
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Quality of focus sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Eisenhower Matrix Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Task Distribution (Eisenhower Matrix)
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main">
                {todayAnalytics.urgentImportantCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Urgent & Important
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {todayAnalytics.notUrgentImportantCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Not Urgent & Important
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {todayAnalytics.urgentNotImportantCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Urgent & Not Important
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {todayAnalytics.notUrgentNotImportantCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Neither Urgent nor Important
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts Section */}
      {rangeData.length > 0 && (
        <>
          {/* Productivity Trend */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              7-Day Productivity Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="productivityScore"
                  stroke="#2196f3"
                  strokeWidth={2}
                  name="Productivity Score"
                />
                <Line
                  type="monotone"
                  dataKey="focusScore"
                  stroke="#4caf50"
                  strokeWidth={2}
                  name="Focus Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Focus Time and Tasks */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Focus Time (Minutes)
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={rangeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) =>
                        new Date(date).toLocaleDateString()
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="focusMinutes"
                      fill="#2196f3"
                      name="Focus Minutes"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tasks Completed
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={rangeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) =>
                        new Date(date).toLocaleDateString()
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="tasksCompletedFromToday"
                      stackId="a"
                      fill="#4caf50"
                      name="Created Today"
                    />
                    <Bar
                      dataKey="tasksCompleted"
                      fill="#2196f3"
                      name="Total Completed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Pomodoros Pie Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Session Distribution (Today)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Focus Time",
                      value: todayAnalytics.focusMinutes,
                      color: "#2196f3",
                    },
                    {
                      name: "Break Time",
                      value: todayAnalytics.breakMinutes,
                      color: "#4caf50",
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}m`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[{ color: "#2196f3" }, { color: "#4caf50" }].map(
                    (entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      {/* Weekly Report */}
      <WeeklyReport />
    </Box>
  );
};

export default AnalyticsPage;
