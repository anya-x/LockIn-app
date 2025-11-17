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
  useTheme,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Timer,
  Speed,
  WarningAmber,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  LightbulbOutlined,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import BurnoutAlert from "../components/analytics/BurnOutAlert";
import WeeklyReport from "../components/analytics/WeeklyReport";
import ProductivityInsights from "../components/analytics/ProductivityInsights";
import CustomTooltip from "../components/analytics/CustomTooltip";
import { exportToCSV } from "../utils/exportToCSV";
import { useTimer } from "../context/TimerContext";
import {
  useAnalyticsRange,
  useRefreshAnalytics,
  useTodayAnalytics,
  useComparisonAnalytics,
} from "../hooks/useAnalytics";

type PeriodType = "week" | "month";

const AnalyticsPage: React.FC = () => {
  const { timer } = useTimer();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [period, setPeriod] = useState<PeriodType>("week");
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [reportExpanded, setReportExpanded] = useState(false);

  // Responsive chart heights
  const chartHeight = isMobile ? 200 : 300;

  // Theme-aware chart colors
  const isDarkMode = theme.palette.mode === "dark";
  const chartColors = {
    primary: isDarkMode ? "#90caf9" : "#2196f3",
    secondary: isDarkMode ? "#81c784" : "#4caf50",
    tertiary: isDarkMode ? "#ba68c8" : "#9c27b0",
    warning: isDarkMode ? "#ffb74d" : "#ff9800",
    error: isDarkMode ? "#e57373" : "#f44336",
    gridColor: isDarkMode ? "#444" : "#e0e0e0",
    textColor: isDarkMode ? "#fff" : "#666",
  };

  const days = period === "week" ? 7 : 30;

  const {
    data: todayAnalytics,
    isLoading: todayLoading,
    error: todayError,
  } = useTodayAnalytics();

  const { data: rangeData = [], isLoading: rangeLoading } =
    useAnalyticsRange(days);

  const getDateRanges = () => {
    const today = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (period === "week") {
      currentEnd = new Date(today);
      currentStart = new Date(today);
      currentStart.setDate(currentStart.getDate() - 6);

      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 6);
    } else {
      currentEnd = new Date(today);
      currentStart = new Date(today);
      currentStart.setDate(currentStart.getDate() - 29);

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

  const { data: comparisonData } = useComparisonAnalytics(
    dateRanges.currentStart,
    dateRanges.currentEnd,
    dateRanges.previousStart,
    dateRanges.previousEnd
  );

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

  const handleExportCSV = () => {
    if (rangeData.length === 0) {
      alert("No data to export");
      return;
    }

    const formattedData = rangeData.map((day) => ({
      Date: new Date(day.date).toLocaleDateString(),
      "Productivity Score": day.productivityScore,
      "Focus Score": day.focusScore,
      "Tasks Created": day.tasksCreated,
      "Tasks Completed": day.tasksCompleted,
      "Completion Rate %": day.completionRate,
      "Pomodoros Completed": day.pomodorosCompleted,
      "Focus Minutes": day.focusMinutes,
      "Interrupted Sessions": day.interruptedSessions,
      "Morning Focus (6AM-12PM)": day.morningFocusMinutes || 0,
      "Afternoon Focus (12PM-6PM)": day.afternoonFocusMinutes || 0,
      "Evening Focus (6PM-12AM)": day.eveningFocusMinutes || 0,
      "Night Focus (12AM-6AM)": day.nightFocusMinutes || 0,
      "Burnout Risk Score": day.burnoutRiskScore,
    }));

    const today = new Date().toISOString().split("T")[0];
    exportToCSV(formattedData, `analytics-${today}`);
  };

  const getTrendIcon = (trend: "up" | "down" | "stable" | undefined) => {
    if (!trend) return null;
    switch (trend) {
      case "up":
        return <TrendingUp fontSize="small" />;
      case "down":
        return <TrendingDown fontSize="small" />;
      default:
        return null;
    }
  };

  const getTrendColor = (
    trend: "up" | "down" | "stable" | undefined,
    inverse = false
  ): "success" | "error" | "default" => {
    if (!trend || trend === "stable") return "default";
    const isPositive = inverse ? trend === "down" : trend === "up";
    return isPositive ? "success" : "error";
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined) return "";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
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
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your productivity and focus patterns
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
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
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={rangeData.length === 0}
            size="small"
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={
              loading ? <CircularProgress size={16} /> : <RefreshIcon />
            }
            onClick={handleRefresh}
            disabled={loading}
            size="small"
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

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Tasks Completed */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">
                  Daily Avg Tasks
                </Typography>
              </Box>
              <Typography variant="h3">
                {comparisonData?.current.tasksCompleted.toFixed(1) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {todayAnalytics.tasksCompletedFromToday}/
                {todayAnalytics.tasksCreated} today (
                {todayAnalytics.completionRate.toFixed(0)}%)
              </Typography>
              {comparisonData && (
                <Box display="flex" alignItems="center" gap={1}>
                  {getTrendIcon(comparisonData.tasksTrend)}
                  <Chip
                    label={formatChange(comparisonData.tasksChange)}
                    color={getTrendColor(comparisonData.tasksTrend)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    vs last {period}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Time */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Timer color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">
                  Daily Avg Focus
                </Typography>
              </Box>
              <Typography variant="h3">
                {comparisonData
                  ? `${Math.floor(comparisonData.current.focusMinutes / 60)}h ${comparisonData.current.focusMinutes % 60}m`
                  : "0h 0m"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {todayAnalytics.pomodorosCompleted} sessions today
                {todayAnalytics.interruptedSessions > 0 &&
                  ` (${todayAnalytics.interruptedSessions} interrupted)`}
              </Typography>
              {comparisonData && (
                <Box display="flex" alignItems="center" gap={1}>
                  {getTrendIcon(comparisonData.focusTrend)}
                  <Chip
                    label={formatChange(comparisonData.focusChange)}
                    color={getTrendColor(comparisonData.focusTrend)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    vs last {period}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Productivity Score */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Speed color="info" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Productivity
                </Typography>
              </Box>
              <Typography variant="h3">
                {comparisonData?.current.productivityScore.toFixed(0) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Focus: {todayAnalytics.focusScore.toFixed(0)}/100 today
              </Typography>
              {comparisonData && (
                <Box display="flex" alignItems="center" gap={1}>
                  {getTrendIcon(comparisonData.productivityTrend)}
                  <Chip
                    label={formatChange(comparisonData.productivityChange)}
                    color={getTrendColor(comparisonData.productivityTrend)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    vs last {period}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Burnout Risk */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WarningAmber color="warning" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Burnout Risk
                </Typography>
              </Box>
              <Typography variant="h3">
                {comparisonData?.current.burnoutRiskScore.toFixed(0) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {comparisonData &&
                comparisonData.current.burnoutRiskScore < 30
                  ? "Low risk"
                  : comparisonData &&
                    comparisonData.current.burnoutRiskScore < 50
                  ? "Moderate risk"
                  : "High risk"}
              </Typography>
              {comparisonData && (
                <Box display="flex" alignItems="center" gap={1}>
                  {getTrendIcon(comparisonData.burnoutTrend)}
                  <Chip
                    label={formatChange(comparisonData.burnoutChange)}
                    color={getTrendColor(comparisonData.burnoutTrend, true)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    vs last {period}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      {rangeData.length > 0 && (
        <>
          {/* Productivity & Focus Trend */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {period === "week" ? "7-Day" : "30-Day"} Performance Trend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Track your productivity and focus quality over time
            </Typography>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={rangeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.gridColor}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  stroke={chartColors.textColor}
                />
                <YAxis stroke={chartColors.textColor} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
                    border: `1px solid ${chartColors.gridColor}`,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="productivityScore"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  name="Productivity Score"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="focusScore"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  name="Focus Score"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Task Progress Over Time */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Daily task creation and completion patterns
            </Typography>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={rangeData}>
                <defs>
                  <linearGradient
                    id="completedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={chartColors.secondary}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColors.secondary}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="createdGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={chartColors.primary}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColors.primary}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.gridColor}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  stroke={chartColors.textColor}
                />
                <YAxis stroke={chartColors.textColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
                    border: `1px solid ${chartColors.gridColor}`,
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="tasksCreated"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#createdGradient)"
                  name="Tasks Created"
                />
                <Area
                  type="monotone"
                  dataKey="tasksCompleted"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#completedGradient)"
                  name="Tasks Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Time of Day Productivity */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Peak Hours
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Discover when you're most focused throughout the day
            </Typography>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={[
                  {
                    period: "Morning",
                    time: "6AM-12PM",
                    minutes: todayAnalytics.morningFocusMinutes || 0,
                  },
                  {
                    period: "Afternoon",
                    time: "12PM-6PM",
                    minutes: todayAnalytics.afternoonFocusMinutes || 0,
                  },
                  {
                    period: "Evening",
                    time: "6PM-12AM",
                    minutes: todayAnalytics.eveningFocusMinutes || 0,
                  },
                  {
                    period: "Night",
                    time: "12AM-6AM",
                    minutes: todayAnalytics.nightFocusMinutes || 0,
                  },
                ]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.gridColor}
                />
                <XAxis
                  dataKey="period"
                  stroke={chartColors.textColor}
                  tickFormatter={(value, index) => {
                    const times = ["6AM-12PM", "12PM-6PM", "6PM-12AM", "12AM-6AM"];
                    return isMobile ? value : `${value}\n${times[index]}`;
                  }}
                />
                <YAxis
                  stroke={chartColors.textColor}
                  label={{
                    value: "Minutes",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: chartColors.textColor },
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {data.period} ({data.time})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {data.minutes} minutes focused
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="minutes" name="Focus Minutes" radius={[8, 8, 0, 0]}>
                  {[
                    { fill: chartColors.warning },
                    { fill: chartColors.primary },
                    { fill: chartColors.tertiary },
                    { fill: chartColors.error },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      {/* Insights Section */}
      <Paper sx={{ mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          sx={{ cursor: "pointer" }}
          onClick={() => setInsightsExpanded(!insightsExpanded)}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LightbulbOutlined color="primary" />
            <Typography variant="h6">Productivity Insights</Typography>
          </Box>
          <IconButton
            sx={{
              transform: insightsExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s",
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        <Collapse in={insightsExpanded}>
          <Divider />
          <Box p={2}>
            <ProductivityInsights />
          </Box>
        </Collapse>
      </Paper>

      {/* Weekly Report */}
      <Paper>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          sx={{ cursor: "pointer" }}
          onClick={() => setReportExpanded(!reportExpanded)}
        >
          <Typography variant="h6">Weekly Report</Typography>
          <IconButton
            sx={{
              transform: reportExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s",
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        <Collapse in={reportExpanded}>
          <Divider />
          <Box p={2}>
            <WeeklyReport />
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default AnalyticsPage;
