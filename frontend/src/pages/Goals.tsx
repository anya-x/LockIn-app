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
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import type { GoalFormData } from "../components/goals/GoalsDialog";
import GoalsDialog from "../components/goals/GoalsDialog";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "../hooks/useGoals";
import type { Goal } from "../services/goalService";
import { useTimer } from "../context/TimerContext";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const Goals: React.FC = () => {
  const theme = useTheme();
  const {
    data: allGoals = [],
    isLoading: loading,
    error: queryError,
  } = useGoals();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const { timer } = useTimer();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string>("");
  const [tabValue, setTabValue] = useState<"all" | "active" | "completed">(
    "active"
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

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

  const handleOpenCreateDialog = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
  };

  const handleSubmitGoal = async (goalData: GoalFormData) => {
    try {
      if (editingGoal) {
        await updateGoalMutation.mutateAsync({ id: editingGoal.id, data: goalData });
      } else {
        await createGoalMutation.mutateAsync(goalData);
      }
      handleCloseDialog();
    } catch (err: any) {
      console.error(`Failed to ${editingGoal ? "update" : "create"} goal:`, err);
      setError(
        err.response?.data?.message ||
          `Failed to ${editingGoal ? "update" : "create"} goal. Please try again.`
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
    <Box>
      <PageHeader
        title="Goals"
        subtitle="Track your pomodoro goals and stay productive!"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Goal
          </Button>
        }
      />

      <Tabs
        value={tabValue}
        onChange={(_, value) => setTabValue(value)}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            fontWeight: 500,
            textTransform: "none",
            fontSize: "0.9375rem",
          },
        }}
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
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  {/* Header skeleton */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={28} sx={{ mb: 0.5 }} />
                      <Skeleton variant="rounded" width={70} height={24} />
                    </Box>
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>

                  {/* Description skeleton */}
                  <Skeleton variant="text" width="100%" sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />

                  {/* Progress bar skeleton */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Skeleton variant="text" width={60} />
                      <Skeleton variant="text" width={30} />
                    </Box>
                    <Skeleton variant="rounded" height={10} sx={{ borderRadius: 2 }} />
                  </Box>

                  {/* Stats skeleton */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {[1, 2, 3].map((j) => (
                      <Grid key={j} size={{ xs: 4 }}>
                        <Skeleton variant="text" width="70%" height={16} />
                        <Skeleton variant="text" width="50%" height={20} />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Date skeleton */}
                  <Skeleton variant="text" width="50%" height={16} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && displayedGoals.length === 0 && (
        <EmptyState
          title={`No ${tabValue === "all" ? "" : tabValue} goals yet`}
          description="Create your first goal to start tracking your progress!"
          action={{
            label: "Create Your First Goal",
            onClick: handleOpenCreateDialog,
            icon: <AddIcon />,
          }}
        />
      )}

      {!loading && displayedGoals.length > 0 && (
        <Grid container spacing={3}>
          {displayedGoals.map((goal) => (
            <Grid key={goal.id} size={{ xs: 12, sm: 6 }}>
              <Card
                sx={{
                  height: "100%",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.primary.main,
                      0.15
                    )}`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
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
                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {goal.title}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={goal.type}
                          size="small"
                          color={getTypeColor(goal.type)}
                          sx={{ fontWeight: 500 }}
                        />
                        {goal.completed && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Completed"
                            size="small"
                            sx={{
                              backgroundColor: alpha("#10B981", 0.1),
                              color: "#10B981",
                              fontWeight: 500,
                              border: `1px solid ${alpha("#10B981", 0.3)}`,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(goal)}
                        aria-label="edit goal"
                        sx={{
                          color: theme.palette.primary.main,
                          "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteGoal(goal.id)}
                        aria-label="delete goal"
                        sx={{
                          color: "#EF4444",
                          "&:hover": { backgroundColor: alpha("#EF4444", 0.1) },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
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
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Progress
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                      >
                        {Math.round(goal.progressPercentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(goal.progressPercentage, 100)}
                      color={getProgressColor(goal.progressPercentage)}
                      sx={{
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 2,
                        },
                      }}
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
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitGoal}
        goal={editingGoal}
      />
    </Box>
  );
};

export default Goals;
