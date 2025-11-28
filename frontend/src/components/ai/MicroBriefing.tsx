import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import aiService from "../../services/aiService";
import { useRateLimit } from "../../hooks/useRateLimit";
import { useAIPreferences } from "../../context/AIPreferencesContext";

/**
 * MicroBriefing - A compact AI briefing widget for the Today page
 *
 * Shares the same query key ["daily-briefing"] with CompactBriefing,
 * so data is cached and shared between components.
 *
 * Shows:
 * - Single-line AI insight (first sentence of summary or first priority)
 * - Priority count chips
 * - Link to full briefing
 */
export const MicroBriefing: React.FC = () => {
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
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours (same as CompactBriefing)
    retry: false,
    enabled: aiEnabled, // Only fetch if AI is enabled
  });

  const error = queryError
    ? (queryError as any).response?.status === 429
      ? "Rate limit exceeded"
      : "Failed to load"
    : null;

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  // Extract a short insight from the briefing
  const getShortInsight = (): string => {
    if (!briefing) return "";

    // Try to get the first sentence of the summary
    const summary = briefing.summary;
    const firstSentence = summary.split(/[.!?]/)[0];

    // If first sentence is too long, use first priority
    if (firstSentence.length > 80 && briefing.topPriorities.length > 0) {
      return `Focus on: ${briefing.topPriorities[0]}`;
    }

    return firstSentence.length > 100
      ? firstSentence.substring(0, 97) + "..."
      : firstSentence;
  };

  // Disabled state
  if (!aiEnabled) {
    return (
      <Paper
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "action.disabledBackground",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AIIcon sx={{ color: "text.disabled", fontSize: 18 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" flex={1}>
          AI insights disabled
        </Typography>
        <Button
          size="small"
          startIcon={<SettingsIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate("/settings")}
          sx={{ textTransform: "none", fontSize: "0.75rem" }}
        >
          Enable
        </Button>
      </Paper>
    );
  }

  // Loading state
  if (isLoading && !briefing) {
    return (
      <Paper
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AIIcon sx={{ color: "white", fontSize: 18 }} />
        </Box>
        <Box flex={1} display="flex" alignItems="center" gap={1}>
          <CircularProgress size={14} />
          <Typography variant="body2" color="text.secondary">
            Loading AI insights...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error && !briefing) {
    return (
      <Paper
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "error.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AIIcon sx={{ color: "white", fontSize: 18 }} />
        </Box>
        <Typography variant="body2" color="error.main" flex={1}>
          {error}
        </Typography>
        <Tooltip title="Retry">
          <IconButton size="small" onClick={handleRefresh} disabled={rateLimit.isAtLimit}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    );
  }

  // No briefing yet - prompt to generate
  if (!briefing) {
    return (
      <Paper
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          cursor: "pointer",
          "&:hover": {
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
          },
        }}
        onClick={() => refetch()}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AIIcon sx={{ color: "white", fontSize: 18 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" flex={1}>
          Click to generate your AI daily briefing
        </Typography>
        <Tooltip
          title={
            rateLimit.isAtLimit
              ? "Daily limit reached"
              : `${rateLimit.remaining} requests left`
          }
        >
          <span>
            <IconButton size="small" disabled={rateLimit.isAtLimit}>
              {isLoading ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Paper>
    );
  }

  // Main briefing display
  const totalPriority = briefing.urgentImportantCount + briefing.importantCount + briefing.urgentCount;

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
          transform: "translateY(-1px)",
          boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
      }}
      onClick={() => navigate("/insights")}
    >
      {/* AI Icon */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AIIcon sx={{ color: "white", fontSize: 18 }} />
      </Box>

      {/* Insight text */}
      <Box flex={1} minWidth={0}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {getShortInsight()}
        </Typography>
      </Box>

      {/* Priority chips */}
      <Box display="flex" gap={0.5} flexShrink={0}>
        {briefing.urgentImportantCount > 0 && (
          <Chip
            label={briefing.urgentImportantCount}
            size="small"
            color="error"
            sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, minWidth: 24 }}
          />
        )}
        {briefing.importantCount > 0 && (
          <Chip
            label={briefing.importantCount}
            size="small"
            color="warning"
            sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, minWidth: 24 }}
          />
        )}
        {briefing.urgentCount > 0 && (
          <Chip
            label={briefing.urgentCount}
            size="small"
            color="info"
            sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, minWidth: 24 }}
          />
        )}
      </Box>

      {/* Refresh & Navigate */}
      <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
        <Tooltip
          title={
            rateLimit.isAtLimit
              ? "Daily limit reached"
              : `Refresh (${rateLimit.remaining} left)`
          }
        >
          <span>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={isLoading || rateLimit.isAtLimit}
              sx={{ p: 0.5 }}
            >
              {isLoading ? (
                <CircularProgress size={14} />
              ) : (
                <RefreshIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <ArrowIcon sx={{ fontSize: 16, color: "text.secondary" }} />
      </Box>
    </Paper>
  );
};

export default MicroBriefing;
