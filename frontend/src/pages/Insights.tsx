import React, { useState, useMemo, useEffect } from "react";
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
  Stack,
  alpha,
  Tabs,
  Tab,
  Skeleton,
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
  LocalFireDepartment as FireIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
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
import ProductivityHeatmap from "../components/analytics/ProductivityHeatmap";
import { exportToCSV } from "../utils/exportToCSV";
import { formatTime } from "../utils/timeFormatting";
import { useTimer } from "../context/TimerContext";
import {
  useAnalyticsRange,
  useRefreshAnalytics,
  useTodayAnalytics,
  useComparisonAnalytics,
  useStreak,
  useTaskVelocity,
} from "../hooks/useAnalytics";
import { useStatisticsData } from "../hooks/useStatistics";
import { FOCUS_PROFILES, type FocusProfile } from "../config/focusProfiles";
import type { FocusSessionResponse } from "../services/sessionService";
import type { Task, TaskStatistics } from "../services/taskService";

type PeriodType = "week" | "month";
type TabType = "overview" | "charts" | "focus";

// Compact Stat Pill Component
interface StatPillProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
}

const StatPill: React.FC<StatPillProps> = ({
  icon,
  value,
  label,
  color,
  trend,
  trendValue,
}) => {
  const theme = useTheme();
  const pillColor = color || theme.palette.text.secondary;

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: pillColor, display: "flex" }}>{icon}</Box>
      <Box>
        <Stack direction="row" spacing={0.5} alignItems="baseline">
          <Typography variant="h6" fontWeight={700}>
            {value}
          </Typography>
          {trend && trendValue && (
            <Chip
              size="small"
              icon={
                trend === "up" ? (
                  <TrendingUp sx={{ fontSize: 14 }} />
                ) : trend === "down" ? (
                  <TrendingDown sx={{ fontSize: 14 }} />
                ) : undefined
              }
              label={trendValue}
              sx={{
                height: 20,
                fontSize: "0.7rem",
                bgcolor:
                  trend === "up"
                    ? alpha(theme.palette.success.main, 0.1)
                    : trend === "down"
                    ? alpha(theme.palette.error.main, 0.1)
                    : "action.hover",
                color:
                  trend === "up"
                    ? "success.main"
                    : trend === "down"
                    ? "error.main"
                    : "text.secondary",
                "& .MuiChip-icon": {
                  color: "inherit",
                },
              }}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Stack>
  );
};

// Profile Stats Interface
interface ProfileStats {
  profile: FocusProfile;
  sessionsCount: number;
  totalMinutes: number;
  completedCount: number;
}

const Insights: React.FC = () => {
  const { timer } = useTimer();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [period, setPeriod] = useState<PeriodType>("week");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [reportExpanded, setReportExpanded] = useState(false);

  const chartHeight = isMobile ? 200 : 280;

  const isDarkMode = theme.palette.mode === "dark";
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.success.main,
    tertiary: theme.palette.secondary.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    gridColor: isDarkMode ? "#444" : "#e0e0e0",
    textColor: isDarkMode ? "#fff" : "#666",
  };

  const days = period === "week" ? 7 : 30;

  // Analytics hooks
  const {
    data: todayAnalytics,
    isLoading: todayLoading,
    error: todayError,
  } = useTodayAnalytics();

  const { data: rangeData = [], isLoading: rangeLoading } =
    useAnalyticsRange(days);

  const { data: streakData } = useStreak();
  const { data: velocityData } = useTaskVelocity();

  // Statistics hooks
  const { data: statsData, isLoading: statsLoading } = useStatisticsData();

  const getDateRanges = () => {
    const today = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

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

  const loading = todayLoading || rangeLoading || statsLoading;
  const error = todayError ? "Failed to load analytics data" : null;

  useEffect(() => {
    if (timer.completionCounter > 0) {
      refreshAnalytics();
    }
  }, [timer.completionCounter, refreshAnalytics]);

  // Calculate profile breakdown from statistics data
  const profileBreakdown = useMemo(() => {
    if (!statsData?.sessions) return [];

    const profileMap = new Map<string, ProfileStats>();

    statsData.sessions.forEach((session: FocusSessionResponse) => {
      if (!session.profileName) return;

      const profile = FOCUS_PROFILES.find((p) => p.id === session.profileName);
      if (!profile) return;

      const existing = profileMap.get(profile.id);
      if (existing) {
        existing.sessionsCount++;
        existing.totalMinutes += session.actualMinutes || 0;
        if (session.completed) existing.completedCount++;
      } else {
        profileMap.set(profile.id, {
          profile,
          sessionsCount: 1,
          totalMinutes: session.actualMinutes || 0,
          completedCount: session.completed ? 1 : 0,
        });
      }
    });

    return Array.from(profileMap.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    );
  }, [statsData?.sessions]);

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
    }));

    const today = new Date().toISOString().split("T")[0];
    exportToCSV(formattedData, `insights-${today}`);
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined) return "";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(0)}%`;
  };

  const getTrend = (
    trend: "up" | "down" | "stable" | undefined
  ): "up" | "down" | "stable" => {
    return trend || "stable";
  };

  if (loading && !todayAnalytics) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Skeleton variant="text" width={150} height={40} />
          <Skeleton variant="rounded" width={200} height={36} />
        </Box>
        <Stack direction="row" spacing={4} mb={4} flexWrap="wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={140} height={50} />
          ))}
        </Stack>
        <Skeleton variant="rounded" height={300} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={300} />
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
        <Typography variant="h5" fontWeight={700}>
          Insights
        </Typography>
        <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
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

      {/* Compact Stat Pills Row */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack
          direction="row"
          spacing={{ xs: 2, md: 4 }}
          flexWrap="wrap"
          useFlexGap
        >
          <StatPill
            icon={<CheckCircle fontSize="small" />}
            value={comparisonData?.current.tasksCompleted.toFixed(1) || "0"}
            label="daily avg tasks"
            color={theme.palette.success.main}
            trend={getTrend(comparisonData?.tasksTrend)}
            trendValue={formatChange(comparisonData?.tasksChange)}
          />
          <StatPill
            icon={<Timer fontSize="small" />}
            value={
              comparisonData
                ? formatTime(comparisonData.current.focusMinutes)
                : "0h"
            }
            label="daily avg focus"
            color={theme.palette.primary.main}
            trend={getTrend(comparisonData?.focusTrend)}
            trendValue={formatChange(comparisonData?.focusChange)}
          />
          <StatPill
            icon={<Speed fontSize="small" />}
            value={comparisonData?.current.productivityScore.toFixed(0) || "0"}
            label="productivity"
            color={theme.palette.info.main}
            trend={getTrend(comparisonData?.productivityTrend)}
            trendValue={formatChange(comparisonData?.productivityChange)}
          />
          {streakData && streakData.currentStreak > 0 && (
            <StatPill
              icon={<FireIcon fontSize="small" />}
              value={streakData.currentStreak}
              label="day streak"
              color={theme.palette.warning.main}
            />
          )}
        </Stack>
      </Paper>

      {/* Burnout Alert */}
      {todayAnalytics.burnoutRiskScore > 0 && (
        <Box mb={3}>
          <BurnoutAlert
            riskScore={todayAnalytics.burnoutRiskScore}
            lateNightSessions={todayAnalytics.lateNightSessions}
            overworkMinutes={todayAnalytics.overworkMinutes}
          />
        </Box>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Charts" value="charts" />
          <Tab label="Focus Analysis" value="focus" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Today's Snapshot */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {todayAnalytics.tasksCompletedFromToday}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  tasks completed today
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {todayAnalytics.pomodorosCompleted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  focus sessions
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} color="info.main">
                  {todayAnalytics.focusScore.toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  focus score
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, textAlign: "center" }}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={
                    todayAnalytics.burnoutRiskScore < 30
                      ? "success.main"
                      : todayAnalytics.burnoutRiskScore < 50
                      ? "warning.main"
                      : "error.main"
                  }
                >
                  {todayAnalytics.burnoutRiskScore.toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  burnout risk
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Productivity Heatmap */}
          <ProductivityHeatmap />

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
                <Typography variant="subtitle1" fontWeight={600}>
                  AI Productivity Insights
                </Typography>
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
              <Typography variant="subtitle1" fontWeight={600}>
                Weekly Report
              </Typography>
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
        </>
      )}

      {/* Charts Tab */}
      {activeTab === "charts" && rangeData.length > 0 && (
        <>
          {/* Performance Trend */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {period === "week" ? "7-Day" : "30-Day"} Performance Trend
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
                  fontSize={12}
                />
                <YAxis stroke={chartColors.textColor} domain={[0, 100]} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
                    border: `1px solid ${chartColors.gridColor}`,
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="productivityScore"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  name="Productivity"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="focusScore"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  name="Focus"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Task Progress */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Task Progress
            </Typography>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={rangeData}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  stroke={chartColors.textColor}
                  fontSize={12}
                />
                <YAxis stroke={chartColors.textColor} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
                    border: `1px solid ${chartColors.gridColor}`,
                    borderRadius: 8,
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
                  name="Created"
                />
                <Area
                  type="monotone"
                  dataKey="tasksCompleted"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#completedGradient)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Peak Hours */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Your Peak Hours
            </Typography>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={[
                  { period: "Morning", time: "6AM-12PM", minutes: todayAnalytics.morningFocusMinutes || 0 },
                  { period: "Afternoon", time: "12PM-6PM", minutes: todayAnalytics.afternoonFocusMinutes || 0 },
                  { period: "Evening", time: "6PM-12AM", minutes: todayAnalytics.eveningFocusMinutes || 0 },
                  { period: "Night", time: "12AM-6AM", minutes: todayAnalytics.nightFocusMinutes || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
                <XAxis dataKey="period" stroke={chartColors.textColor} fontSize={12} />
                <YAxis stroke={chartColors.textColor} fontSize={12} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {data.period} ({data.time})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {data.minutes} min focused
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="minutes" name="Focus Minutes" radius={[6, 6, 0, 0]}>
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

      {/* Focus Analysis Tab */}
      {activeTab === "focus" && (
        <>
          {/* Profile Usage */}
          {profileBreakdown.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Focus Profile Usage
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                See which profiles you use most often
              </Typography>

              <Box>
                {profileBreakdown.map((profileStat, index) => (
                  <React.Fragment key={profileStat.profile.id}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            icon={
                              <span style={{ fontSize: "1rem" }}>
                                {profileStat.profile.icon}
                              </span>
                            }
                            label={profileStat.profile.name}
                            size="small"
                            sx={{
                              bgcolor: profileStat.profile.color,
                              color: "white",
                              fontWeight: 500,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {profileStat.profile.cycleName}
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                          {formatTime(profileStat.totalMinutes)}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={4}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Sessions
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {profileStat.sessionsCount}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Completed
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {profileStat.completedCount}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Completion Rate
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {profileStat.sessionsCount > 0
                              ? Math.round(
                                  (profileStat.completedCount /
                                    profileStat.sessionsCount) *
                                    100
                                )
                              : 0}
                            %
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </React.Fragment>
                ))}
              </Box>
            </Paper>
          )}

          {/* Task Velocity */}
          {velocityData && velocityData.current > 0 && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Task Velocity (7-day avg)
              </Typography>
              <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                <Typography variant="h4" color="info.main" fontWeight={700}>
                  {velocityData.current} tasks/day
                </Typography>
                {velocityData.trend !== "stable" && (
                  <Chip
                    size="small"
                    icon={
                      velocityData.trend === "up" ? (
                        <TrendingUp fontSize="small" />
                      ) : (
                        <TrendingDown fontSize="small" />
                      )
                    }
                    label={`${velocityData.change > 0 ? "+" : ""}${velocityData.change}%`}
                    color={velocityData.trend === "up" ? "success" : "error"}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Previous week: {velocityData.previous} tasks/day
              </Typography>
            </Paper>
          )}

          {/* Task Stats Summary */}
          {statsData?.taskStats && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Task Status Overview
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid size={{ xs: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {statsData.taskStats.completedCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      {statsData.taskStats.inProgressCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.text.secondary, 0.1),
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      {statsData.taskStats.todoCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      To Do
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Insights;
