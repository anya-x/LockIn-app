import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  CircularProgress,
  Alert,
  Box,
  Divider,
  alpha,
  useTheme,
  TextField,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddTaskIcon from "@mui/icons-material/AddTask";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Task, TaskRequest } from "../../types/task";
import {
  aiService,
  type TaskBreakdownResult,
  type SubtaskSuggestion,
} from "../../services/aiService";
import { useRateLimit } from "../../hooks/useRateLimit";
import RateLimitIndicator from "../ai/RateLimitIndicator";

interface AITaskBreakdownProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onCreateSubtasks: (subtasks: TaskRequest[]) => Promise<void>;
}

/**
 *
 * TODO:
 * - add retry button on error
 * - show progress when creating multiple subtasks
 * - allow editing AI suggestions
 * - add checkboxes to select which subtasks to create
 * - hide cost to user
 * - add loading animation or skeleton
 * - speed up task breakdown
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
  const [editableSubtasks, setEditableSubtasks] = useState<SubtaskSuggestion[]>(
    []
  );
  const rateLimit = useRateLimit();

  useEffect(() => {
    if (result?.subtasks) {
      setEditableSubtasks([...result.subtasks]);
    }
  }, [result]);

  const handleBreakdown = async () => {
    if (rateLimit.isAtLimit) {
      setError("You've reached your daily AI request limit. Please try again tomorrow.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const breakdownResult = await aiService.breakdownTask(task.id);
      setResult(breakdownResult);
      // Refetch rate limit after successful request
      await rateLimit.refetch();
    } catch (err: any) {
      console.error("AI breakdown failed:", err);

      // Handle rate limit errors specifically
      if (err.response?.status === 429) {
        setError(err.response?.data?.message || "Rate limit exceeded. Please try again later.");
        await rateLimit.refetch();
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to generate task breakdown. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubtask = (
    index: number,
    field: keyof SubtaskSuggestion,
    value: any
  ) => {
    const updated = [...editableSubtasks];
    updated[index] = { ...updated[index], [field]: value };
    setEditableSubtasks(updated);
  };

  const handleRemoveSubtask = (index: number) => {
    const updated = editableSubtasks.filter((_, i) => i !== index);
    setEditableSubtasks(updated);
  };

  const handleCreateSubtasks = async () => {
    if (editableSubtasks.length === 0) return;

    setCreating(true);
    try {
      const subtaskRequests: TaskRequest[] = editableSubtasks.map(
        (subtask: SubtaskSuggestion) => ({
          title: subtask.title,
          description: subtask.description,
          status: "TODO" as const,
          isUrgent: subtask.isUrgent,
          isImportant: subtask.isImportant,
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

        <Box mb={3}>
          <RateLimitIndicator status={rateLimit} variant="detailed" />
        </Box>

        <Divider sx={{ my: 2 }} />

        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={2}>
              AI is analyzing your task...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This usually takes 2-3 seconds
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && !loading && (
          <>
            {result.reasoning && (
              <Box
                mb={2}
                p={2}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
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

            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Review & Edit Subtasks ({editableSubtasks.length}):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total:{" "}
                {editableSubtasks.reduce(
                  (sum, st) => sum + st.estimatedMinutes,
                  0
                )}{" "}
                minutes
              </Typography>
            </Box>

            <List sx={{ mt: 2 }}>
              {editableSubtasks.map((subtask, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 2,
                    flexDirection: "column",
                    alignItems: "stretch",
                    p: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <Box display="flex" gap={1} mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ minWidth: 24 }}
                    >
                      {index + 1}.
                    </Typography>
                    <TextField
                      fullWidth
                      label="Task Title"
                      value={subtask.title}
                      onChange={(e) =>
                        handleUpdateSubtask(index, "title", e.target.value)
                      }
                      size="small"
                      variant="outlined"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveSubtask(index)}
                      title="Remove subtask"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={subtask.description}
                    onChange={(e) =>
                      handleUpdateSubtask(index, "description", e.target.value)
                    }
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Box display="flex" gap={2}>
                    <TextField
                      type="number"
                      label="Estimated Minutes"
                      value={subtask.estimatedMinutes}
                      onChange={(e) =>
                        handleUpdateSubtask(
                          index,
                          "estimatedMinutes",
                          parseInt(e.target.value) || 0
                        )
                      }
                      size="small"
                      sx={{ width: 150 }}
                      InputProps={{ inputProps: { min: 5, max: 480 } }}
                    />

                    <FormGroup sx={{ flexDirection: "row", gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={subtask.isUrgent}
                            onChange={(e) =>
                              handleUpdateSubtask(
                                index,
                                "isUrgent",
                                e.target.checked
                              )
                            }
                            sx={{
                              color: "error.main",
                              "&.Mui-checked": {
                                color: "error.main",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" color="error">
                            Urgent
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={subtask.isImportant}
                            onChange={(e) =>
                              handleUpdateSubtask(
                                index,
                                "isImportant",
                                e.target.checked
                              )
                            }
                            sx={{
                              color: "warning.main",
                              "&.Mui-checked": {
                                color: "warning.main",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" color="warning.main">
                            Important
                          </Typography>
                        }
                      />
                    </FormGroup>
                  </Box>
                </ListItem>
              ))}
            </List>
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
              disabled={rateLimit.isAtLimit}
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
            startIcon={
              creating ? <CircularProgress size={16} /> : <AddTaskIcon />
            }
            onClick={handleCreateSubtasks}
            disabled={creating || editableSubtasks.length === 0}
          >
            {creating
              ? "Creating..."
              : `Create ${editableSubtasks.length} Subtask${
                  editableSubtasks.length !== 1 ? "s" : ""
                }`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AITaskBreakdown;
