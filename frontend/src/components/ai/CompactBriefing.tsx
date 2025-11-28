import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import aiService from "../../services/aiService";
import { useRateLimit } from "../../hooks/useRateLimit";
import { useAIPreferences } from "../../context/AIPreferencesContext";

export const CompactBriefing: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
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

  const error = queryError
    ? (queryError as any).response?.status === 429
      ? "Rate limit exceeded"
      : "Failed to load briefing"
    : null;

  const handleRefresh = () => {
    refetch();
  };

  // Compact header when AI is disabled or no briefing
  if (!aiEnabled) {
    return (
      <Paper
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <AIIcon sx={{ color: "text.secondary" }} />
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary">
            AI Briefing disabled
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<SettingsIcon />}
          onClick={() => navigate("/settings")}
          sx={{ textTransform: "none" }}
        >
          Enable
        </Button>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        overflow: "hidden",
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
      }}
    >
      {/* Header - always visible */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <AIIcon sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={600} flex={1}>
          AI Daily Briefing
        </Typography>

        {/* Quick stats chips */}
        {briefing && !expanded && (
          <Box display="flex" gap={0.5}>
            {briefing.urgentImportantCount > 0 && (
              <Chip
                label={briefing.urgentImportantCount}
                size="small"
                color="error"
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
              />
            )}
            {briefing.importantCount > 0 && (
              <Chip
                label={briefing.importantCount}
                size="small"
                color="warning"
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
              />
            )}
          </Box>
        )}

        <Tooltip
          title={
            rateLimit.isAtLimit
              ? "Daily limit reached"
              : `${rateLimit.remaining} requests left`
          }
        >
          <span>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={isLoading || rateLimit.isAtLimit}
            >
              {isLoading ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <IconButton size="small">
          {expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      {/* Collapsible content */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

          {!briefing && !isLoading && !error && (
            <Typography variant="body2" color="text.secondary">
              Click refresh to generate your personalized briefing
            </Typography>
          )}

          {briefing && (
            <>
              {/* Priority chips */}
              <Box display="flex" gap={0.5} mb={1.5} flexWrap="wrap">
                {briefing.urgentImportantCount > 0 && (
                  <Chip
                    label={`${briefing.urgentImportantCount} Urgent & Important`}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ fontSize: "0.75rem" }}
                  />
                )}
                {briefing.importantCount > 0 && (
                  <Chip
                    label={`${briefing.importantCount} Important`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: "0.75rem" }}
                  />
                )}
                {briefing.urgentCount > 0 && (
                  <Chip
                    label={`${briefing.urgentCount} Urgent`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ fontSize: "0.75rem" }}
                  />
                )}
              </Box>

              {/* Summary */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  whiteSpace: "pre-line",
                  lineHeight: 1.5,
                }}
              >
                {briefing.summary}
              </Typography>

              {/* Top priorities */}
              {briefing.topPriorities && briefing.topPriorities.length > 0 && (
                <>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    TOP PRIORITIES
                  </Typography>
                  <List dense disablePadding>
                    {briefing.topPriorities.slice(0, 3).map((priority, i) => (
                      <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              {i + 1}. {priority}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default CompactBriefing;
