import React from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  Assignment as TaskIcon,
  Flag as GoalIcon,
} from "@mui/icons-material";
import { useAchievements } from "../../hooks/useAchievements";
import type { Achievement } from "../../services/achievementService";

const Achievements: React.FC = () => {
  const { data: achievements = [], isLoading, error } = useAchievements();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TASKS":
        return <TaskIcon />;
      case "FOCUS":
        return <TimerIcon />;
      case "GOALS":
        return <GoalIcon />;
      default:
        return <TrophyIcon />;
    }
  };

  const getCategoryColor = (
    category: string
  ): "default" | "primary" | "secondary" | "info" | "success" => {
    switch (category) {
      case "TASKS":
        return "primary";
      case "FOCUS":
        return "info";
      case "GOALS":
        return "success";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress size={32} />
          <Typography sx={{ ml: 2 }}>Loading achievements...</Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Alert severity="error">Failed to load achievements</Alert>
      </Paper>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Achievements
        </Typography>
        <Chip
          icon={<TrophyIcon />}
          label={`${unlockedCount}/${totalCount} Unlocked`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2}>
        {achievements.map((achievement: Achievement) => (
          <Grid key={achievement.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: achievement.unlocked ? "success.main" : "grey.300",
                borderRadius: 1,
                bgcolor: achievement.unlocked ? "success.light" : "grey.50",
                opacity: achievement.unlocked ? 1 : 0.7,
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                },
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {getCategoryIcon(achievement.category)}
                  <Chip
                    label={achievement.category}
                    size="small"
                    color={getCategoryColor(achievement.category)}
                  />
                </Box>
                {achievement.unlocked ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <LockIcon color="disabled" />
                )}
              </Box>

              {/* Title & Description */}
              <Typography variant="h6" sx={{ mb: 0.5, fontSize: "1rem" }}>
                {achievement.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, minHeight: 40 }}
              >
                {achievement.description}
              </Typography>

              {/* Progress */}
              {!achievement.unlocked && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {achievement.progress}/{achievement.target}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={achievement.progressPercentage}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </>
              )}

              {achievement.unlocked && achievement.unlockedDate && (
                <Typography variant="caption" color="success.dark">
                  Unlocked on{" "}
                  {new Date(achievement.unlockedDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>

      {unlockedCount === 0 && (
        <Box sx={{ textAlign: "center", py: 4, mt: 2 }}>
          <LockIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            Start completing tasks and goals to unlock achievements!
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default Achievements;
