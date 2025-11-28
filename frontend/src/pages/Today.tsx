import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Timer as TimerIcon,
  LocalFireDepartment as FireIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTimer } from "../context/TimerContext";
import { taskService } from "../services/taskService";
import { sessionService } from "../services/sessionService";
import { analyticsService } from "../services/analyticsService";
import { getStatusColor } from "../utils/colorMaps";
import type { Task, TaskRequest } from "../types/task";
import TaskFormModal from "../components/tasks/TaskFormModal";

const Today: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { timer, selectedProfile } = useTimer();
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Fetch today's stats
  const { data: todayStats, isLoading: statsLoading } = useQuery({
    queryKey: ["today-stats"],
    queryFn: sessionService.getTodayStats,
    staleTime: 60000,
  });

  // Fetch streak
  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ["streak"],
    queryFn: analyticsService.getStreak,
    staleTime: 300000,
  });

  // Fetch task statistics
  const { data: taskStats, isLoading: taskStatsLoading } = useQuery({
    queryKey: ["task-statistics"],
    queryFn: taskService.getStatistics,
    staleTime: 60000,
  });

  // Fetch urgent/important tasks for today
  const { data: priorityTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["priority-tasks"],
    queryFn: async () => {
      const tasks = await taskService.getIncompleteTasks();
      return tasks
        .filter((t) => t.isUrgent || t.isImportant)
        .sort((a, b) => {
          if (a.isUrgent && a.isImportant) return -1;
          if (b.isUrgent && b.isImportant) return 1;
          if (a.isUrgent) return -1;
          if (b.isUrgent) return 1;
          return 0;
        })
        .slice(0, 5);
    },
    staleTime: 60000,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleQuickComplete = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: "COMPLETED",
        isUrgent: task.isUrgent,
        isImportant: task.isImportant,
        categoryId: task.category?.id,
      });
      // Refetch priority tasks
      queryClient.invalidateQueries({ queryKey: ["priority-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-statistics"] });
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  };

  const handleSaveTask = async (taskData: TaskRequest) => {
    try {
      await taskService.createTask(taskData);
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["priority-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-statistics"] });
      setTaskModalOpen(false);
    } catch (err) {
      console.error("Failed to create task:", err);
      throw err;
    }
  };

  const completionRate = taskStats
    ? taskStats.totalTasks > 0
      ? Math.round((taskStats.completedCount / taskStats.totalTasks) * 100)
      : 0
    : 0;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {getGreeting()}, {user?.firstName || "there"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        {/* Focus Time */}
        <Paper sx={{ p: 2.5, textAlign: "center" }}>
          {statsLoading ? (
            <Skeleton variant="text" width="60%" sx={{ mx: "auto" }} />
          ) : (
            <>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}>
                <TimerIcon sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography variant="h5" fontWeight={700}>
                  {todayStats?.totalMinutes || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                min focused today
              </Typography>
            </>
          )}
        </Paper>

        {/* Sessions */}
        <Paper sx={{ p: 2.5, textAlign: "center" }}>
          {statsLoading ? (
            <Skeleton variant="text" width="60%" sx={{ mx: "auto" }} />
          ) : (
            <>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}>
                <CheckIcon sx={{ color: "success.main", fontSize: 20 }} />
                <Typography variant="h5" fontWeight={700}>
                  {todayStats?.sessionsCompleted || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                sessions done
              </Typography>
            </>
          )}
        </Paper>

        {/* Streak */}
        <Paper sx={{ p: 2.5, textAlign: "center" }}>
          {streakLoading ? (
            <Skeleton variant="text" width="60%" sx={{ mx: "auto" }} />
          ) : (
            <>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}>
                <FireIcon
                  sx={{
                    color: streak?.currentStreak ? "warning.main" : "text.disabled",
                    fontSize: 20,
                  }}
                />
                <Typography variant="h5" fontWeight={700}>
                  {streak?.currentStreak || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                day streak
              </Typography>
            </>
          )}
        </Paper>

        {/* Tasks Completed */}
        <Paper sx={{ p: 2.5, textAlign: "center" }}>
          {taskStatsLoading ? (
            <Skeleton variant="text" width="60%" sx={{ mx: "auto" }} />
          ) : (
            <>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}>
                <TrendingIcon sx={{ color: "info.main", fontSize: 20 }} />
                <Typography variant="h5" fontWeight={700}>
                  {completionRate}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                tasks completed
              </Typography>
            </>
          )}
        </Paper>
      </Box>

      {/* Active Timer Banner */}
      {timer.sessionStartedAt && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )}, ${alpha(theme.palette.primary.light, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            cursor: "pointer",
          }}
          onClick={() => navigate("/timer")}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: selectedProfile.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TimerIcon sx={{ color: "white" }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {timer.isRunning ? "Session in progress" : "Session paused"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProfile.name} - {timer.sessionType.replace("_", " ")}
                </Typography>
              </Box>
            </Box>
            <Button variant="contained" size="small">
              View Timer
            </Button>
          </Box>
        </Paper>
      )}

      {/* Quick Actions */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayIcon />}
          onClick={() => navigate("/timer")}
          sx={{ flex: { xs: 1, sm: "0 0 auto" } }}
        >
          Start Focus Session
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setTaskModalOpen(true)}
          sx={{ flex: { xs: 1, sm: "0 0 auto" } }}
        >
          Add Task
        </Button>
      </Box>

      {/* Priority Tasks */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Priority Tasks
          </Typography>
          <Button size="small" onClick={() => navigate("/tasks")}>
            View All
          </Button>
        </Box>

        {tasksLoading ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={64} />
            ))}
          </Box>
        ) : priorityTasks && priorityTasks.length > 0 ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {priorityTasks.map((task) => (
              <Paper
                key={task.id}
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                  },
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickComplete(task)}
                  sx={{
                    minWidth: 32,
                    width: 32,
                    height: 32,
                    p: 0,
                    borderRadius: "50%",
                    borderColor: "divider",
                    "&:hover": {
                      bgcolor: "success.light",
                      borderColor: "success.main",
                      color: "success.main",
                    },
                  }}
                >
                  <CheckIcon fontSize="small" />
                </Button>

                <Box flex={1} minWidth={0}>
                  <Typography variant="body1" fontWeight={500} noWrap>
                    {task.title}
                  </Typography>
                  <Box display="flex" gap={0.5} mt={0.5}>
                    {task.isUrgent && task.isImportant && (
                      <Chip
                        label="Do First"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          bgcolor: alpha("#EF4444", 0.1),
                          color: "#EF4444",
                        }}
                      />
                    )}
                    {task.isUrgent && !task.isImportant && (
                      <Chip
                        label="Urgent"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          bgcolor: alpha("#F59E0B", 0.1),
                          color: "#F59E0B",
                        }}
                      />
                    )}
                    {task.isImportant && !task.isUrgent && (
                      <Chip
                        label="Important"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          bgcolor: alpha("#3B82F6", 0.1),
                          color: "#3B82F6",
                        }}
                      />
                    )}
                    <Chip
                      label={task.status.replace("_", " ")}
                      size="small"
                      color={getStatusColor(task.status)}
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  </Box>
                </Box>

                <Button
                  size="small"
                  onClick={() => navigate("/timer")}
                  sx={{ minWidth: 80 }}
                >
                  Focus
                </Button>
              </Paper>
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary" gutterBottom>
              No priority tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mark tasks as urgent or important to see them here
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Progress Overview */}
      {taskStats && taskStats.totalTasks > 0 && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            OVERALL PROGRESS
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="h4" fontWeight={700}>
              {taskStats.completedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              of {taskStats.totalTasks} tasks completed
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          />
        </Paper>
      )}

      {/* Task Creation Modal */}
      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
      />
    </Box>
  );
};

export default Today;
