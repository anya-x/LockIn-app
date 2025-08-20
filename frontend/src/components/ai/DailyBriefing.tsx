import React, { useEffect, useState } from "react";
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
import aiService, { type BriefingResult } from "../../services/aiService";
import { useRateLimit } from "../../hooks/useRateLimit.ts";
import RateLimitIndicator from "../ai/RateLimitIndicator";

export const DailyBriefing: React.FC = () => {
  const [briefing, setBriefing] = useState<BriefingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rateLimit = useRateLimit();

  const loadBriefing = async () => {
    if (rateLimit.isAtLimit) {
      setError(
        "You've reached your daily AI request limit. Please try again tomorrow."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.getDailyBriefing();
      setBriefing(result);

      await rateLimit.refetch();
    } catch (err: any) {
      console.error("Failed to load briefing:", err);

      if (err.response?.status === 429) {
        setError(
          err.response?.data?.message ||
            "Rate limit exceeded. Please try again later."
        );
        await rateLimit.refetch();
      } else {
        setError(
          err.response?.data?.message || "Failed to load daily briefing"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing();
  }, []);

  const handleRefresh = () => {
    loadBriefing();
  };

  return (
    <Card elevation={3}>
      <CardHeader
        avatar={<TodayIcon color="primary" />}
        title="Daily Briefing"
        action={
          <Tooltip
            title={
              rateLimit.isAtLimit
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
                disabled={isLoading || rateLimit.isAtLimit}
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
