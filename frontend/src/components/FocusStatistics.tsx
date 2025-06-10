import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendIcon,
  Schedule as ScheduleIcon,
  LocalFireDepartment as FireIcon,
  Palette as PaletteIcon,
  Assignment as TaskIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  sessionService,
  type FocusSessionResponse,
} from "../services/sessionService";
import {
  taskService,
  type Task,
  type TaskStatistics,
} from "../services/taskService";
import { FOCUS_PROFILES, type FocusProfile } from "../config/focusProfiles";
import { useTimer } from "../context/TimerContext";

interface ProfileStats {
  profile: FocusProfile;
  sessionsCount: number;
  totalMinutes: number;
  completedCount: number;
}

interface Statistics {
  totalFocusMinutes: number;
  totalSessions: number;
  completedSessions: number;
  averageSessionLength: number;
  workSessions: number;
  breakSessions: number;
  completionRate: number;

  profileBreakdown: ProfileStats[];
  mostUsedProfile: FocusProfile | null;

  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  taskCompletionRate: number;

  averageFocusTimePerTask: number;
  tasksWithFocusSessions: number;
  tasksWithMeaningfulWork: number;
  focusQualityRate: number;
}

const FocusStatistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<
    "Today" | "7days" | "30days" | "90days" | "all"
  >("30days");
  const { timer } = useTimer();

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  useEffect(() => {
    if (timer.completionCounter > 0) {
      fetchStatistics();
    }
  }, [timer.completionCounter]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStatistics();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatistics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const [allSessions, taskStats, allTasks] = await Promise.all([
        sessionService.getUserSessions(),
        taskService.getStatistics(),
        taskService.getTasks(),
      ]);

      const tasks = Array.isArray(allTasks) ? allTasks : [];

      if (tasks.length === 0) {
        console.warn("⚠️ No tasks returned from API!");
      }

      let recentSessions = allSessions;

      if (dateRange !== "all") {
        const daysMap = { Today: 1, "7days": 7, "30days": 30, "90days": 90 };
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - daysMap[dateRange]);

        recentSessions = allSessions.filter((session) => {
          if (!session.startedAt) return true;
          const sessionDate = new Date(session.startedAt);
          return sessionDate >= daysAgo;
        });
      }

      const calculated = calculateStatistics(recentSessions, taskStats, tasks);
      setStats(calculated);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (
    sessions: FocusSessionResponse[],
    taskStats: TaskStatistics,
    tasks: Task[]
  ): Statistics => {
    const workSessions = sessions.filter((s) => s.sessionType === "WORK");
    const totalFocusMinutes = workSessions.reduce(
      (sum, s) => sum + (s.actualMinutes || 0),
      0
    );

    const completedSessions = sessions.filter((s) => s.completed).length;
    const completionRate =
      sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0;

    const sessionsWithTime = sessions.filter(
      (s) => s.actualMinutes && s.actualMinutes > 0
    );
    const averageSessionLength =
      sessionsWithTime.length > 0
        ? sessionsWithTime.reduce((sum, s) => sum + s.actualMinutes!, 0) /
          sessionsWithTime.length
        : 0;

    const breakSessions = sessions.filter(
      (s) => s.sessionType === "SHORT_BREAK" || s.sessionType === "LONG_BREAK"
    ).length;

    const profileMap = new Map<string, ProfileStats>();

    sessions.forEach((session) => {
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

    const profileBreakdown = Array.from(profileMap.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    );

    const mostUsedProfile =
      profileBreakdown.length > 0 ? profileBreakdown[0].profile : null;

    const completedTasks = taskStats.completedCount;
    const inProgressTasks = taskStats.inProgressCount;
    const todoTasks = taskStats.todoCount;
    const totalTasks = taskStats.totalTasks;

    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const averageFocusTimePerTask =
      completedTasks > 0 ? Math.round(totalFocusMinutes / completedTasks) : 0;

    const tasksWithFocusSessions = tasks.filter((task) =>
      sessions.some((s) => s.taskId === task.id)
    ).length;

    const tasksWithMeaningfulWork = tasks.filter((task) => {
      const taskSessions = sessions.filter((s) => s.taskId === task.id);
      const totalMinutes = taskSessions.reduce(
        (sum, s) => sum + (s.actualMinutes || 0),
        0
      );
      return totalMinutes >= 1; // CHANGE TTHIS
    }).length;

    const focusQualityRate =
      tasksWithFocusSessions > 0
        ? Math.round((tasksWithMeaningfulWork / tasksWithFocusSessions) * 100)
        : 0;

    return {
      // Focus metrics
      totalFocusMinutes,
      totalSessions: sessions.length,
      completedSessions,
      averageSessionLength: Math.round(averageSessionLength),
      workSessions: workSessions.length,
      breakSessions,
      completionRate: Math.round(completionRate),

      // Profile metrics
      profileBreakdown,
      mostUsedProfile,

      // Task metrics
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      taskCompletionRate,

      // Integration metrics
      averageFocusTimePerTask,
      tasksWithFocusSessions,
      tasksWithMeaningfulWork,
      focusQualityRate,
    };
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Failed to load statistics
        </Typography>
      </Paper>
    );
  }

  if (stats.totalSessions === 0 && stats.totalTasks === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          No Data Yet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create tasks and start focus sessions to see statistics!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Productivity Statistics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your focus sessions and task progress
            {lastUpdated &&
              ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchStatistics}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Date Range Filter */}
      <Box display="flex" justifyContent="center" mb={3}>
        <ToggleButtonGroup
          value={dateRange}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setDateRange(newValue);
            }
          }}
          size="small"
        >
          <ToggleButton value="Today">Today</ToggleButton>
          <ToggleButton value="7days">Last 7 Days</ToggleButton>
          <ToggleButton value="30days">Last 30 Days</ToggleButton>
          <ToggleButton value="90days">Last 90 Days</ToggleButton>
          <ToggleButton value="all">All Time</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main Stats Grid */}
      <Grid container spacing={3}>
        {/* Total Focus Time */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TimerIcon color="primary" />
                <Typography variant="h6">Total Focus Time</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {formatTime(stats.totalFocusMinutes)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across {stats.workSessions} work sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sessions Completed */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckIcon color="success" />
                <Typography variant="h6">Sessions Completed</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.completedSessions} / {stats.totalSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stats.completionRate}% completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Session */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendIcon color="info" />
                <Typography variant="h6">Average Session</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.averageSessionLength}m
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Average focus duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks Completed */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TaskIcon color="primary" />
                <Typography variant="h6">Tasks Completed</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.completedTasks} / {stats.totalTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stats.taskCompletionRate}% completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Time per Task */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SpeedIcon sx={{ color: "#9c27b0" }} />
                <Typography variant="h6">Focus per Task</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.averageFocusTimePerTask}m
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Average focus time per completed task
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Most Used Profile */}
        {stats.mostUsedProfile && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <FireIcon sx={{ color: stats.mostUsedProfile.color }} />
                  <Typography variant="h6">Favorite Profile</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mt={2}>
                  <Chip
                    icon={
                      <span style={{ fontSize: "1.5rem" }}>
                        {stats.mostUsedProfile.icon}
                      </span>
                    }
                    label={stats.mostUsedProfile.name}
                    sx={{
                      bgcolor: stats.mostUsedProfile.color,
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1rem",
                      height: "40px",
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {stats.mostUsedProfile.cycleName} timing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Work vs Break */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ScheduleIcon color="warning" />
                <Typography variant="h6">Work vs Breaks</Typography>
              </Box>
              <Box display="flex" gap={2} alignItems="baseline">
                <Box>
                  <Typography variant="h4" component="span" color="primary">
                    {stats.workSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Work
                  </Typography>
                </Box>
                <Typography variant="h5" color="text.disabled">
                  /
                </Typography>
                <Box>
                  <Typography
                    variant="h4"
                    component="span"
                    color="success.main"
                  >
                    {stats.breakSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Breaks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Status Breakdown */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PaletteIcon color="secondary" />
                <Typography variant="h6">Task Status</Typography>
              </Box>
              <Box display="flex" flexDirection="column" gap={1} mt={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Chip
                    label={stats.completedTasks}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                  <Chip
                    label={stats.inProgressTasks}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    To Do
                  </Typography>
                  <Chip
                    label={stats.todoTasks}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Focus Quality */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "white",
                    fontSize: "0.875rem",
                  }}
                >
                  🎯
                </Box>
                <Typography variant="h6">Task Focus Quality</Typography>
              </Box>

              <Box display="flex" gap={2} alignItems="center" mt={2} mb={2}>
                <Box textAlign="center">
                  <Typography variant="h3" component="div">
                    {stats.tasksWithFocusSessions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    started
                  </Typography>
                </Box>

                <Typography variant="h4" color="text.disabled">
                  →
                </Typography>

                <Box textAlign="center">
                  <Typography variant="h3" component="div" color="primary.main">
                    {stats.tasksWithMeaningfulWork}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    meaningful
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary">
                {stats.focusQualityRate}% of started tasks received focused work
                (1+ min) {/* change back!!!*/}
              </Typography>

              {stats.tasksWithFocusSessions > 0 &&
                stats.focusQualityRate < 60 && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "info.lighter",
                      borderRadius: 1,
                      borderLeft: "3px solid",
                      borderColor: "info.main",
                    }}
                  >
                    <Typography variant="caption" color="info.dark">
                      💡 Try focusing on fewer tasks at a time for deeper work
                    </Typography>
                  </Box>
                )}

              {stats.tasksWithFocusSessions > 0 &&
                stats.focusQualityRate >= 80 && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "success.lighter",
                      borderRadius: 1,
                      borderLeft: "3px solid",
                      borderColor: "success.main",
                    }}
                  >
                    <Typography variant="caption" color="success.dark">
                      ✨ Excellent focus! You're doing deep work on your tasks
                    </Typography>
                  </Box>
                )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Profile Breakdown */}
      {stats.profileBreakdown.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Focus Profile Usage
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            See which profiles you use most often
          </Typography>

          <Box sx={{ mt: 3 }}>
            {stats.profileBreakdown.map((profileStat, index) => (
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
                    <Typography variant="h6">
                      {formatTime(profileStat.totalMinutes)}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Sessions
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {profileStat.sessionsCount}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {profileStat.completedCount}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
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
                    </Grid>
                  </Grid>
                </Box>
              </React.Fragment>
            ))}
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Tip:</strong> Different profiles work better for
              different tasks. Experiment to find what helps you focus best!
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Integration Insights */}
      {stats.tasksWithFocusSessions > 0 && (
        <Paper
          sx={{
            p: 3,
            mt: 3,
            bgcolor: "primary.50",
            borderLeft: "4px solid",
            borderColor: "primary.main",
          }}
        >
          <Typography variant="h6" gutterBottom>
            📊 Productivity Insights
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="body2">
              • You've completed <strong>{stats.completedTasks} tasks</strong>{" "}
              with <strong>{formatTime(stats.totalFocusMinutes)}</strong> of
              focused work
            </Typography>
            <Typography variant="body2">
              • Average of{" "}
              <strong>{stats.averageFocusTimePerTask} minutes</strong> of focus
              time per completed task
            </Typography>
            <Typography variant="body2">
              • Started work on{" "}
              <strong>{stats.tasksWithFocusSessions} tasks</strong>, with{" "}
              <strong>{stats.tasksWithMeaningfulWork}</strong> receiving
              meaningful attention (5+ min)
            </Typography>
            {stats.focusQualityRate < 60 && (
              <Typography variant="body2" sx={{ color: "warning.dark" }}>
                • 💡 Focus quality is {stats.focusQualityRate}% - consider
                working on fewer tasks simultaneously for deeper work
              </Typography>
            )}
            {stats.focusQualityRate >= 80 && (
              <Typography variant="body2" sx={{ color: "success.dark" }}>
                • ✨ Excellent focus quality ({stats.focusQualityRate}%)! You're
                giving tasks the deep attention they deserve
              </Typography>
            )}
            {stats.mostUsedProfile && (
              <Typography variant="body2">
                • You focus best with{" "}
                <strong>{stats.mostUsedProfile.name}</strong> profile (
                {stats.mostUsedProfile.cycleName})
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default FocusStatistics;
