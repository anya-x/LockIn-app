import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TodayIcon from "@mui/icons-material/Today";
import SettingsIcon from "@mui/icons-material/Settings";
import aiService, { type BriefingResult } from "../../services/aiService";
import { useRateLimit } from "../../hooks/useRateLimit";
import { useAIPreferences } from "../../context/AIPreferencesContext";
import RateLimitIndicator from "../ai/RateLimitIndicator";
import { useNavigate } from "react-router-dom";

export const DailyBriefing: React.FC = () => {
  const rateLimit = useRateLimit();
  const { aiEnabled } = useAIPreferences();
  const navigate = useNavigate();

  const {
    data: briefing,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["daily-briefing"],
    queryFn: async () => {
      const result = await aiService.getDailyBriefing();
      rateLimit.refetch();
      return result;
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  const handleRefresh = () => {
    refetch();
  };

  const error = queryError
    ? (queryError as any).response?.status === 429
      ? (queryError as any).response?.data?.message ||
        "Rate limit exceeded. Please try again later."
      : (queryError as any).response?.data?.message ||
        (queryError as Error).message ||
        "Failed to load daily briefing"
    : null;

  return (
    <Card elevation={3}>
      <CardHeader
        avatar={<TodayIcon color="primary" />}
        title="Daily Briefing"
        action={
          <Tooltip
            title={
              !aiEnabled
                ? "AI features are disabled - Enable in Settings"
                : rateLimit.isAtLimit
                ? "Daily AI request limit reached"
                : `${rateLimit.remaining} AI requests remaining`
            }
            arrow
          >
            <span>
              <Button
                size="small"
                startIcon={
                  isLoading ? <CircularProgress size={16} /> : <RefreshIcon />
                }
                onClick={handleRefresh}
                disabled={!aiEnabled || isLoading || rateLimit.isAtLimit}
                sx={{ textTransform: "none" }}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        }
      />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <RateLimitIndicator status={rateLimit} variant="compact" />
        </Box>
        {isLoading && !briefing && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {!briefing && !isLoading && !error && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            {!aiEnabled ? (
              <>
                <SettingsIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  AI features are currently disabled
                </Typography>
                <Button
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate("/settings")}
                  sx={{ textTransform: "none", mt: 2 }}
                >
                  Enable in Settings
                </Button>
              </>
            ) : (
              <>
                <TodayIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Click "Refresh" to generate your AI-powered daily briefing
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Get a summary of your tasks and priorities for today
                </Typography>
              </>
            )}
          </Box>
        )}

        {briefing && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              {briefing.urgentImportantCount > 0 && (
                <Chip
                  label={`${briefing.urgentImportantCount} Urgent & Important`}
                  color="error"
                  size="small"
                />
              )}
              {briefing.importantCount > 0 && (
                <Chip
                  label={`${briefing.importantCount} Important`}
                  color="warning"
                  size="small"
                />
              )}
              {briefing.urgentCount > 0 && (
                <Chip
                  label={`${briefing.urgentCount} Urgent`}
                  color="info"
                  size="small"
                />
              )}
              {briefing.otherCount > 0 && (
                <Chip label={`${briefing.otherCount} Other`} size="small" />
              )}
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, whiteSpace: "pre-line" }}
            >
              {briefing.summary}
            </Typography>

            {briefing.topPriorities && briefing.topPriorities.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Top Priorities Today:
                </Typography>
                <List dense>
                  {briefing.topPriorities.map((priority, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`${index + 1}. ${priority}`} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              Generated with {briefing.tokensUsed} tokens ($
              {briefing.costUSD.toFixed(4)})
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyBriefing;
