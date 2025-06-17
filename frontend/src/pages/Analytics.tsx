import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
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
import api from "../services/api";

interface Analytics {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  completionRate: number;
  pomodorosCompleted: number;
  focusMinutes: number;
  productivityScore: number;
  focusScore: number;
  burnoutRiskScore: number;
}

const Analytics = () => {
  const [todayStats, setTodayStats] = useState<Analytics | null>(null);
  const [historicalData, setHistoricalData] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const todayResponse = await api.get("/api/analytics/today");
      setTodayStats(todayResponse.data);

      const rangeResponse = await api.get("/api/analytics/range?days=30");
      setHistoricalData(rangeResponse.data);
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Today's Stats */}
      {todayStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Tasks Completed
              </Typography>
              <Typography variant="h3">{todayStats.tasksCompleted}</Typography>
              <Typography variant="body2" color="text.secondary">
                {todayStats.completionRate.toFixed(1)}% rate
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Pomodoros
              </Typography>
              <Typography variant="h3">
                {todayStats.pomodorosCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.floor(todayStats.focusMinutes / 60)}h{" "}
                {todayStats.focusMinutes % 60}m focus
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Productivity
              </Typography>
              <Typography variant="h3">
                {todayStats.productivityScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                out of 100
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                bgcolor:
                  todayStats.burnoutRiskScore > 60
                    ? "error.light"
                    : "success.light",
              }}
            >
              <Typography variant="h6">Burnout Risk</Typography>
              <Typography variant="h3">
                {todayStats.burnoutRiskScore.toFixed(0)}
              </Typography>
              <Typography variant="body2">
                {todayStats.burnoutRiskScore > 60 ? "High" : "Low"}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Historical Charts */}
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
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="productivityScore"
                  stroke="#8884d8"
                  name="Productivity"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Focus Time */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Daily Focus Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="focusMinutes"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Focus Minutes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Task Completion */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Task Completion
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasksCompleted" fill="#8884d8" name="Completed" />
                <Bar dataKey="tasksCreated" fill="#82ca9d" name="Created" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">
            No historical data yet. Check back tomorrow!
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Analytics;
