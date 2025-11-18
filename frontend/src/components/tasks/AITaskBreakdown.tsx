import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddTaskIcon from "@mui/icons-material/AddTask";
import type { Task, TaskRequest } from "../../types/task";
import {
  aiService,
  type TaskBreakdownResult,
  type SubtaskSuggestion,
} from "../../services/aiService";

interface AITaskBreakdownProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onCreateSubtasks: (subtasks: TaskRequest[]) => Promise<void>;
}

/**
 * Dialog for AI-powered task breakdown.
 *
 * Shows AI-generated subtasks and allows user to create them.
 *
 * CURRENT LIMITATIONS:
 * - No error retry mechanism
 * - No loading progress indicator
 * - No option to edit AI suggestions before creating
 * - Subtasks are created all at once (no individual selection)
 *
 * TODO:
 * - Add retry button on error
 * - Show progress when creating multiple subtasks
 * - Allow editing AI suggestions
 * - Add checkboxes to select which subtasks to create
 * - Show cost to user (currently hidden)
 * - Add loading animation or skeleton
 */
const AITaskBreakdown: React.FC<AITaskBreakdownProps> = ({
  task,
  open,
  onClose,
  onCreateSubtasks,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  /**
   * Request AI breakdown from backend.
   *
   * BUG: Doesn't handle slow API responses well (no timeout)
   * BUG: No retry mechanism
   */
  const handleBreakdown = async () => {
    setLoading(true);
    setError(null);

    try {
      const breakdownResult = await aiService.breakdownTask(task.id);
      setResult(breakdownResult);
    } catch (err: any) {
      console.error("AI breakdown failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to generate task breakdown. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create subtasks from AI suggestions.
   *
   * Converts AI subtasks to TaskRequest format and passes to parent.
   */
  const handleCreateSubtasks = async () => {
    if (!result) return;

    setCreating(true);
    try {
      // Convert AI subtasks to TaskRequest format
      const subtaskRequests: TaskRequest[] = result.subtasks.map(
        (subtask: SubtaskSuggestion) => ({
          title: subtask.title,
          description: subtask.description,
          status: "TODO" as const,
          isUrgent: subtask.priority === "HIGH",
          isImportant:
            subtask.priority === "HIGH" || subtask.priority === "MEDIUM",
          categoryId: task.categoryId,
        })
      );

      await onCreateSubtasks(subtaskRequests);
      onClose();
    } catch (err: any) {
      console.error("Failed to create subtasks:", err);
      setError("Failed to create subtasks. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  /**
   * Get chip color based on priority.
   */
  const getPriorityColor = (
    priority: string
  ): "error" | "warning" | "info" => {
    switch (priority) {
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      default:
        return "info";
    }
  };

  /**
   * Reset state when dialog closes.
   */
  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6">AI Task Breakdown</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Show original task */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary">
            Original Task:
          </Typography>
          <Typography variant="h6" gutterBottom>
            {task.title}
          </Typography>
          {task.description && (
            <Typography variant="body2" color="text.secondary">
              {task.description}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Loading state */}
        {loading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            py={4}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={2}>
              AI is analyzing your task...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This usually takes 2-3 seconds
            </Typography>
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* AI Reasoning */}
            {result.reasoning && (
              <Box
                mb={2}
                p={2}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                  border: `1px solid ${alpha(
                    theme.palette.primary.main,
                    0.1
                  )}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="primary"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  AI Analysis:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.reasoning}
                </Typography>
              </Box>
            )}

            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Suggested Subtasks ({result.subtasks.length}):
            </Typography>

            <List sx={{ mt: 2 }}>
              {result.subtasks.map((subtask, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: "column",
                    alignItems: "flex-start",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" width="100%" mb={1}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {index + 1}. {subtask.title}
                        </Typography>
                      }
                    />
                    <Chip
                      label={subtask.priority}
                      size="small"
                      color={getPriorityColor(subtask.priority)}
                    />
                  </Box>

                  {subtask.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ pl: 2 }}
                    >
                      {subtask.description}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ pl: 2, mt: 0.5 }}
                  >
                    ⏱ Estimated: {subtask.estimatedMinutes} minutes
                  </Typography>
                </ListItem>
              ))}
            </List>

            {/* Show metadata (interesting for debugging) */}
            <Box
              mt={2}
              pt={2}
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                AI Stats: {result.tokensUsed} tokens | $
                {result.costUSD.toFixed(4)} cost
              </Typography>
            </Box>
          </>
        )}

        {/* Initial state - show button */}
        {!result && !loading && !error && (
          <Box textAlign="center" py={4}>
            <AutoAwesomeIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Click below to let AI break down this task into actionable
              subtasks.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleBreakdown}
              sx={{ mt: 2 }}
            >
              Generate Breakdown
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>

        {result && (
          <Button
            variant="contained"
            startIcon={creating ? <CircularProgress size={16} /> : <AddTaskIcon />}
            onClick={handleCreateSubtasks}
            disabled={creating}
          >
            {creating
              ? "Creating..."
              : `Create ${result.subtasks.length} Subtasks`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AITaskBreakdown;
