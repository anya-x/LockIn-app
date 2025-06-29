import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Skeleton,
} from "@mui/material";
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
} from "recharts";
import { analyticsService, type Analytics } from "../services/analyticsService";
import BurnoutAlert from "../components/analytics/BurnOutAlert";
import WeeklyReport from "../components/analytics/WeeklyReport";

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayData, setTodayData] = useState<Analytics | null>(null);
  const [historicalData, setHistoricalData] = useState<Analytics[]>([]);

  const chartColors = {
    productivity: "#1976d2",
    focus: "#2e7d32",
    burnout: "#d32f2f",
    tasksCompleted: "#1976d2",
    tasksCreated: "#ed6c02",
    focusMinutes: "#2e7d32",
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const todayResponse = await analyticsService.getTodayAnalytics();
      setTodayData(todayResponse);

      const rangeResponse = await analyticsService.getAnalyticsRange(30);
      setHistoricalData(rangeResponse);
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error);
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((n) => (
            <Grid key={n} size={{ xs: 12, md: 3 }}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!todayData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          No analytics data available. Complete some tasks and focus sessions to
          see your analytics!
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Analytics Dashboard
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Today's Score Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Productivity Score */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Productivity Score
              </Typography>
              <Typography
                variant="h3"
                color={
                  todayData.productivityScore >= 70
                    ? "success.main"
                    : todayData.productivityScore >= 40
                    ? "warning.main"
                    : "error.main"
                }
              >
                {todayData.productivityScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                out of 100
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Score */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Focus Score
              </Typography>
              <Typography
                variant="h3"
                color={
                  todayData.focusScore >= 70
                    ? "success.main"
                    : todayData.focusScore >= 40
                    ? "warning.main"
                    : "error.main"
                }
              >
                {todayData.focusScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {todayData.focusMinutes} minutes focused
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Burnout Risk */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Burnout Risk
              </Typography>
              <Typography
                variant="h3"
                color={
                  todayData.burnoutRiskScore >= 60
                    ? "error.main"
                    : todayData.burnoutRiskScore >= 30
                    ? "warning.main"
                    : "success.main"
                }
              >
                {todayData.burnoutRiskScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {todayData.lateNightSessions} late sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks Completed */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Tasks Today
              </Typography>
              <Typography variant="h3">{todayData.tasksCompleted}</Typography>
              <Typography variant="body2" color="text.secondary">
                {todayData.completionRate.toFixed(0)}% completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {todayData && todayData.burnoutRiskScore > 40 && (
        <BurnoutAlert
          riskScore={todayData.burnoutRiskScore}
          lateNightSessions={todayData.lateNightSessions}
          overworkMinutes={todayData.overworkMinutes}
        />
      )}
      <WeeklyReport />
      {/* Charts */}
      {historicalData.length > 0 ? (
        <>
          {/* Productivity Trend */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Productivity Trend (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip labelFormatter={formatDate} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="productivityScore"
                  stroke={chartColors.productivity}
                  strokeWidth={2}
                  name="Productivity"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="focusScore"
                  stroke={chartColors.focus}
                  strokeWidth={2}
                  name="Focus"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Focus Time Area Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Focus Time Distribution (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="focusMinutes"
                  stroke={chartColors.focusMinutes}
                  fill={chartColors.focusMinutes}
                  fillOpacity={0.6}
                  name="Focus Minutes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Task Completion Bar Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Task Activity (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Legend />
                <Bar
                  dataKey="tasksCompleted"
                  fill={chartColors.tasksCompleted}
                  name="Completed"
                />
                <Bar
                  dataKey="tasksCreated"
                  fill={chartColors.tasksCreated}
                  name="Created"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Burnout Risk Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Burnout Risk Trend (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip labelFormatter={formatDate} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="burnoutRiskScore"
                  stroke={chartColors.burnout}
                  strokeWidth={2}
                  name="Burnout Risk"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Alert severity="info">
            No historical data available yet. Check back tomorrow after the
            scheduled analytics job runs!
          </Alert>
        </Paper>
      )}
    </Container>
  );
};

export default AnalyticsPage;
