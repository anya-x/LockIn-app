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
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TodayIcon from "@mui/icons-material/Today";
import aiService, { BriefingResult } from "../../services/aiService";

/**
 * Daily briefing widget for dashboard.
 *
 * Shows AI-generated summary of today's tasks with priorities.
 *
 * BUG (Commit 224): Calls API on every component mount!
 * This wastes credits if user refreshes page.
 * Will be fixed in Commit 225 with backend caching.
 */
export const DailyBriefing: React.FC = () => {
  const [briefing, setBriefing] = useState<BriefingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBriefing = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.getDailyBriefing();
      setBriefing(result);
    } catch (err: any) {
      console.error("Failed to load briefing:", err);
      setError(
        err.response?.data?.message || "Failed to load daily briefing"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // BUG: Loads on every mount! Wastes API credits on page refreshes
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
          <Button
            size="small"
            startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
        }
      />
      <CardContent>
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
            {/* Task count chips */}
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
                <Chip
                  label={`${briefing.otherCount} Other`}
                  size="small"
                />
              )}
            </Box>

            {/* AI Summary */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: "pre-line" }}>
              {briefing.summary}
            </Typography>

            {/* Top Priorities */}
            {briefing.topPriorities && briefing.topPriorities.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Top Priorities Today:
                </Typography>
                <List dense>
                  {briefing.topPriorities.map((priority, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${index + 1}. ${priority}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Usage info */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Generated with {briefing.tokensUsed} tokens (${briefing.costUSD.toFixed(4)})
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyBriefing;
