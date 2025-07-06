import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import type { GoalFormData } from "../components/goals/GoalsDialog";
import GoalsDialog from "../components/goals/GoalsDialog";
import { useGoals, useCreateGoal, useDeleteGoal } from "../hooks/useGoals";
import { useTimer } from "../context/TimerContext";
import { useQueryClient } from "@tanstack/react-query";

const Goals: React.FC = () => {
  const {
    data: allGoals = [],
    isLoading: loading,
    error: queryError,
  } = useGoals();
  const createGoalMutation = useCreateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const { timer } = useTimer();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string>("");
  const [tabValue, setTabValue] = useState<"all" | "active" | "completed">(
    "active"
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (timer.completionCounter > 0) {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    }
  }, [timer.completionCounter, queryClient]);

  const displayedGoals = useMemo(() => {
    if (tabValue === "active") {
      return allGoals.filter((goal) => !goal.completed);
    } else if (tabValue === "completed") {
      return allGoals.filter((goal) => goal.completed);
    }
    return allGoals;
  }, [tabValue, allGoals]);

  const handleCreateGoal = async (goalData: GoalFormData) => {
    try {
      await createGoalMutation.mutateAsync(goalData);
      setCreateDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to create goal:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create goal. Please try again."
      );
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) {
      return;
    }

    try {
      await deleteGoalMutation.mutateAsync(id);
    } catch (err: any) {
      console.error("Failed to delete goal:", err);
      setError("Failed to delete goal. Please try again.");
    }
  };

  const getProgressColor = (
    progress: number
  ): "error" | "warning" | "success" => {
    if (progress < 30) return "error";
    if (progress < 70) return "warning";
    return "success";
  };

  const getTypeColor = (
    type: string
  ): "default" | "primary" | "secondary" | "info" => {
    switch (type) {
      case "DAILY":
        return "info";
      case "WEEKLY":
        return "primary";
      case "MONTHLY":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Goals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Goal
        </Button>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, value) => setTabValue(value)}
        sx={{ mb: 3 }}
      >
        <Tab label="Active" value="active" />
        <Tab label="Completed" value="completed" />
        <Tab label="All" value="all" />
      </Tabs>

      {(error || queryError) && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error || "Failed to load goals. Please try again."}
        </Alert>
      )}

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading goals...</Typography>
        </Box>
      )}

      {!loading && displayedGoals.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No {tabValue === "all" ? "" : tabValue} goals yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create your first goal to start tracking your progress!
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mt: 3 }}
          >
            Create Your First Goal
          </Button>
        </Box>
      )}

      {!loading && displayedGoals.length > 0 && (
        <Grid container spacing={3}>
          {displayedGoals.map((goal) => (
            <Grid key={goal.id} size={{ xs: 12, sm: 6 }}>
              <Card>
                <CardContent>
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {goal.title}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={goal.type}
                          size="small"
                          color={getTypeColor(goal.type)}
                        />
                        {goal.completed && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Completed"
                            size="small"
                            color="success"
                          />
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteGoal(goal.id)}
                      color="error"
                      aria-label="delete goal"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {goal.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {goal.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(goal.progressPercentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(goal.progressPercentage, 100)}
                      color={getProgressColor(goal.progressPercentage)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {goal.targetTasks && goal.targetTasks > 0 && (
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Tasks
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {goal.currentTasks} / {goal.targetTasks}
                        </Typography>
                      </Grid>
                    )}
                    {goal.targetPomodoros && goal.targetPomodoros > 0 && (
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Pomodoros
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {goal.currentPomodoros} / {goal.targetPomodoros}
                        </Typography>
                      </Grid>
                    )}
                    {goal.targetFocusMinutes && goal.targetFocusMinutes > 0 && (
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Focus Time
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {goal.currentFocusMinutes} / {goal.targetFocusMinutes}
                          m
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                    </Typography>
                  </Box>

                  {goal.completed && goal.completedDate && (
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CheckCircleIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main">
                        Completed on {formatDate(goal.completedDate)}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <GoalsDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateGoal}
      />
    </Box>
  );
};

export default Goals;
