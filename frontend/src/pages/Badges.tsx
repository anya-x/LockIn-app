import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Stack,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { BadgeGrid } from "../components/badges/BadgeGrid";
import { badgeService } from "../services/badgeService";
import type { Badge, BadgeStats } from "../types/badge";

const Badges: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      setError(null);

      const [badgesData, statsData] = await Promise.all([
        badgeService.getAllBadges(),
        badgeService.getBadgeStats(),
      ]);

      setBadges(badgesData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch badges:", err);
      setError("Failed to load badges. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TrophyIcon fontSize="large" color="primary" />
          Badges
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your progress and unlock achievements as you complete tasks, focus sessions, and goals.
        </Typography>
      </Box>

      {/* Stats Card */}
      {stats && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Your Progress
            </Typography>
            <Chip
              icon={<TrophyIcon />}
              label={`${stats.earnedBadges} / ${stats.totalBadges}`}
              color="primary"
            />
          </Stack>

          <Box sx={{ mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={stats.progressPercentage}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {stats.progressPercentage}% Complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.totalBadges - stats.earnedBadges} badges remaining
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* Badge Grid */}
      {badges.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <LockIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No badges yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start completing tasks and focus sessions to earn your first badge!
          </Typography>
        </Paper>
      ) : (
        <BadgeGrid badges={badges} />
      )}
    </Box>
  );
};

export default Badges;
