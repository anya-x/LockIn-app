import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  useTheme,
  alpha,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import badgeService, { type Badge } from "../services/badgeService";

const Badges: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState<"all" | "earned" | "locked">("all");

  const {
    data: badges = [],
    isLoading,
    error,
  } = useQuery<Badge[]>({
    queryKey: ["badges"],
    queryFn: async () => {
      const response = await badgeService.getUserBadges(false);
      return response.data;
    },
  });

  const displayedBadges = useMemo(() => {
    if (tabValue === "earned") {
      return badges.filter((badge) => badge.earned);
    } else if (tabValue === "locked") {
      return badges.filter((badge) => !badge.earned);
    }
    return badges;
  }, [tabValue, badges]);

  const earnedCount = useMemo(
    () => badges.filter((b) => b.earned).length,
    [badges]
  );

  const getBadgeCategory = (badgeType: string): string => {
    if (badgeType.includes("TASK")) return "Task Badges";
    if (badgeType.includes("POMODORO") || badgeType.includes("FOCUS"))
      return "Focus Badges";
    if (badgeType.includes("GOAL")) return "Goal Badges";
    return "Other";
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "Task Badges":
        return theme.palette.primary.main;
      case "Focus Badges":
        return theme.palette.secondary.main;
      case "Goal Badges":
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const groupedBadges = useMemo(() => {
    const groups: Record<string, Badge[]> = {};
    displayedBadges.forEach((badge) => {
      const category = getBadgeCategory(badge.badgeType);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(badge);
    });
    return groups;
  }, [displayedBadges]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load badges. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Badges
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Earn badges by completing tasks, pomodoros, and goals!
          </Typography>
        </Box>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <TrophyIcon color="primary" />
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {earnedCount}/{badges.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Badges Earned
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label={`All (${badges.length})`} value="all" />
        <Tab label={`Earned (${earnedCount})`} value="earned" />
        <Tab label={`Locked (${badges.length - earnedCount})`} value="locked" />
      </Tabs>

      {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
        <Box key={category} mb={4}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Box
              sx={{
                width: 4,
                height: 24,
                bgcolor: getCategoryColor(category),
                borderRadius: 1,
              }}
            />
            <Typography variant="h6" fontWeight="600">
              {category}
            </Typography>
            <Chip
              label={categoryBadges.length}
              size="small"
              sx={{
                bgcolor: alpha(getCategoryColor(category), 0.1),
                color: getCategoryColor(category),
                fontWeight: 600,
              }}
            />
          </Box>

          <Grid container spacing={2}>
            {categoryBadges.map((badge) => (
              <Grid
                key={badge.badgeType}
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              >
                <Card
                  sx={{
                    height: "100%",
                    position: "relative",
                    transition: "all 0.3s ease",
                    opacity: badge.earned ? 1 : 0.6,
                    border: badge.earned
                      ? `2px solid ${getCategoryColor(category)}`
                      : "2px solid transparent",
                    "&:hover": {
                      transform: badge.earned ? "translateY(-4px)" : "none",
                      boxShadow: badge.earned ? 4 : 1,
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      textAlign="center"
                    >
                      <Box
                        sx={{
                          fontSize: "3rem",
                          mb: 1,
                          position: "relative",
                          filter: badge.earned ? "none" : "grayscale(100%)",
                        }}
                      >
                        {badge.icon}
                        {!badge.earned && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <LockIcon
                              sx={{
                                fontSize: "2rem",
                                color: theme.palette.grey[600],
                              }}
                            />
                          </Box>
                        )}
                      </Box>

                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        {badge.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 40 }}
                      >
                        {badge.description}
                      </Typography>

                      <Chip
                        label={
                          badge.earned
                            ? `Earned ${new Date(
                                badge.earnedAt!
                              ).toLocaleDateString()}`
                            : `Complete ${badge.requirement} to unlock`
                        }
                        size="small"
                        color={badge.earned ? "success" : "default"}
                        sx={{
                          fontWeight: 600,
                          bgcolor: badge.earned
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.grey[500], 0.1),
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {displayedBadges.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            bgcolor: alpha(theme.palette.grey[500], 0.05),
          }}
        >
          <TrophyIcon
            sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No badges in this category yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === "earned"
              ? "Complete tasks, pomodoros and goals to earn your first badge!"
              : "Keep working to unlock more badges!"}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Badges;
