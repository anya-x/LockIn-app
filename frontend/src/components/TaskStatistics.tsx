import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  TrendingUp,
} from "@mui/icons-material";
import api from "../services/api";

interface Statistics {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  urgentCount: number;
  importantCount: number;
  urgentAndImportantCount: number;
  completionRate: number;
  tasksByCategory: { [key: string]: number };
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
}

const TaskStatistics: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.get("/tasks/statistics");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
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

  if (!stats) {
    return <Typography>Error loading statistics</Typography>;
  }

  const statCards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: <Schedule color="primary" />,
      color: "#2196f3",
    },
    {
      title: "To Do",
      value: stats.todoCount,
      icon: <RadioButtonUnchecked color="action" />,
      color: "#757575",
    },
    {
      title: "In Progress",
      value: stats.inProgressCount,
      icon: <TrendingUp color="warning" />,
      color: "#ff9800",
    },
    {
      title: "Completed",
      value: stats.completedCount,
      icon: <CheckCircle color="success" />,
      color: "#4caf50",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Statistics Dashboard
      </Typography>

      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Box mb={1}>{stat.icon}</Box>
              <Typography
                variant="h4"
                sx={{ color: stat.color, fontWeight: "bold" }}
              >
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Completion Rate
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h3" color="primary">
                {stats.completionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of all tasks completed
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.completionRate}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              This Week
            </Typography>
            <Box display="flex" justifyContent="space-around">
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {stats.tasksCreatedThisWeek}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {stats.tasksCompletedThisWeek}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Priority Breakdown
            </Typography>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography>🔥 Urgent & Important</Typography>
                <Typography fontWeight="bold">
                  {stats.urgentAndImportantCount}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>⚡ Urgent</Typography>
                <Typography fontWeight="bold">{stats.urgentCount}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>⭐ Important</Typography>
                <Typography fontWeight="bold">
                  {stats.importantCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tasks by Category
            </Typography>
            {Object.keys(stats.tasksByCategory).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No categorized tasks
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                {Object.entries(stats.tasksByCategory).map(
                  ([category, count]) => (
                    <Box
                      key={category}
                      display="flex"
                      justifyContent="space-between"
                    >
                      <Typography>{category}</Typography>
                      <Typography fontWeight="bold">{count}</Typography>
                    </Box>
                  )
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskStatistics;
