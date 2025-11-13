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
  Download as DownloadIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
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
import { exportWeeklyReportToPDF } from "../utils/exportPDF";

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

  const [exportingPDF, setExportingPDF] = useState(false);

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

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      await exportWeeklyReportToPDF(
        "User",
        rangeData[0]?.date || "",
        rangeData[rangeData.length - 1]?.date || "",
        {
          tasksCompleted: todayAnalytics?.tasksCompleted || 0,
          pomodoros: todayAnalytics?.pomodorosCompleted || 0,
          focusMinutes: todayAnalytics?.focusMinutes || 0,
          productivityScore: todayAnalytics?.productivityScore || 0,
        }
      );
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPDF(false);
    }
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
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={
              exportingPDF ? <CircularProgress size={16} /> : <DownloadIcon />
            }
            onClick={handleExportPDF}
            disabled={exportingPDF}
          >
            {exportingPDF ? "Generating PDF..." : "Export PDF"}
          </Button>
          <Button
            variant="outlined"
            startIcon={
              loading ? <CircularProgress size={16} /> : <RefreshIcon />
            }
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Burnout Alert */}
      {todayAnalytics.burnoutRiskScore > 0 && (
        <BurnoutAlert
          riskScore={todayAnalytics.burnoutRiskScore}
          lateNightSessions={todayAnalytics.lateNightSessions}
          overworkMinutes={todayAnalytics.overworkMinutes}
        />
      )}

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
                <Typography variant="subtitle2">Tasks</Typography>
              </Box>
              <Typography variant="h3">
                {todayAnalytics.tasksCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {todayAnalytics.tasksCreated} created
              </Typography>
              {todayAnalytics.tasksCreated > 0 && (
                <Chip
                  label={`${todayAnalytics.completionRate.toFixed(0)}%`}
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
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

      {/* Task Distribution Pie Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Task Distribution by Eisenhower Matrix
        </Typography>
        <div id="task-distribution-chart">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
            <Pie
              data={[
                {
                  name: "Urgent & Important",
                  value: todayAnalytics.urgentImportantCount,
                  color: "#d32f2f",
                },
                {
                  name: "Not Urgent & Important",
                  value: todayAnalytics.notUrgentImportantCount,
                  color: "#f57c00",
                },
                {
                  name: "Urgent & Not Important",
                  value: todayAnalytics.urgentNotImportantCount,
                  color: "#1976d2",
                },
                {
                  name: "Neither",
                  value: todayAnalytics.notUrgentNotImportantCount,
                  color: "#7cb342",
                },
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {[
                { color: "#d32f2f" },
                { color: "#f57c00" },
                { color: "#1976d2" },
                { color: "#7cb342" },
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        </div>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: "block" }}
        >
          Based on Eisenhower Matrix - shows how you prioritize tasks
        </Typography>
      </Paper>

      {/* Charts Section */}
      {rangeData.length > 0 && (
        <>
          {/* Productivity Trend */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              7-Day Productivity Trend
            </Typography>
            <div id="productivity-chart">
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
            </div>
          </Paper>

          {/* Focus Time Area Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Focus Time Distribution (7 Days)
            </Typography>
            <div id="focus-time-chart">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={rangeData}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <YAxis
                  label={{
                    value: "Minutes",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="focusMinutes"
                  stroke="#2196f3"
                  fillOpacity={1}
                  fill="url(#colorFocus)"
                  name="Focus Minutes"
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              Total focused work time per day
            </Typography>
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
                      dataKey="tasksCompleted"
                      fill="#4caf50"
                      name="Tasks Completed"
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

          {/* Burnout Risk Trend */}
          {rangeData.some((d) => d.burnoutRiskScore > 0) && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Burnout Risk Trend
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Based on late night work, consecutive days, and productivity
                decline
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={rangeData}>
                  <defs>
                    <linearGradient
                      id="colorBurnout"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f44336" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f44336" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
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
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  {/* Danger zones */}
                  <Area
                    type="monotone"
                    dataKey="burnoutRiskScore"
                    stroke="#f44336"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBurnout)"
                    name="Burnout Risk"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Risk level indicators */}
              <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: "#4caf50",
                      borderRadius: "50%",
                    }}
                  />
                  <Typography variant="caption">Low (0-30)</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: "#ff9800",
                      borderRadius: "50%",
                    }}
                  />
                  <Typography variant="caption">Medium (31-60)</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: "#f44336",
                      borderRadius: "50%",
                    }}
                  />
                  <Typography variant="caption">High (61-100)</Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                Based on Maslach Burnout Inventory research - tracks exhaustion
                indicators
              </Alert>
            </Paper>
          )}
        </>
      )}

      {/* Weekly Report */}
      <WeeklyReport />
    </Box>
  );
};

export default AnalyticsPage;
