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
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Divider,
  alpha,
  useTheme,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  FormControlLabel,
  Checkbox,
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

interface AITaskBreakdownProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onCreateSubtasks: (subtasks: TaskRequest[]) => Promise<void>;
}

/**
 * Dialog for AI-powered task breakdown.
 *
 * Shows AI-generated subtasks with full editing capabilities.
 *
 * Features:
 * ✅ Edit task titles and descriptions
 * ✅ Adjust estimated minutes
 * ✅ Set Eisenhower Matrix flags (Urgent/Important checkboxes)
 * ✅ Remove unwanted subtasks
 * ✅ Real-time total time calculation
 *
 * Eisenhower Matrix mapping:
 * - Urgent + Important = Do First (High Priority)
 * - Important only = Schedule (Medium Priority)
 * - Urgent only = Delegate (Low Priority)
 * - Neither = Eliminate/Later (No Priority)
 *
 * CURRENT LIMITATIONS:
 * - No error retry mechanism
 * - No loading progress indicator when creating
 * - No drag-and-drop reordering
 * - Subtasks are created all at once (no individual selection)
 *
 * TODO:
 * - Add retry button on error
 * - Show progress bar when creating multiple subtasks
 * - Add drag-and-drop reordering
 * - Add checkboxes to select which subtasks to create
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
  const [editableSubtasks, setEditableSubtasks] = useState<SubtaskSuggestion[]>([]);

  // Sync editable subtasks when result changes
  // Convert priority to isUrgent/isImportant flags
  useEffect(() => {
    if (result?.subtasks) {
      const subtasksWithFlags = result.subtasks.map((subtask) => ({
        ...subtask,
        isUrgent: subtask.priority === "HIGH" || subtask.priority === "LOW",
        isImportant: subtask.priority === "HIGH" || subtask.priority === "MEDIUM",
      }));
      setEditableSubtasks(subtasksWithFlags);
    }
  }, [result]);

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
   * Update a subtask field.
   */
  const handleUpdateSubtask = (index: number, field: keyof SubtaskSuggestion, value: any) => {
    const updated = [...editableSubtasks];
    updated[index] = { ...updated[index], [field]: value };
    setEditableSubtasks(updated);
  };

  /**
   * Remove a subtask from the list.
   */
  const handleRemoveSubtask = (index: number) => {
    const updated = editableSubtasks.filter((_, i) => i !== index);
    setEditableSubtasks(updated);
  };

  /**
   * Create subtasks from edited suggestions.
   *
   * Converts edited subtasks to TaskRequest format and passes to parent.
   * Uses Eisenhower Matrix flags (isUrgent/isImportant) directly.
   */
  const handleCreateSubtasks = async () => {
    if (editableSubtasks.length === 0) return;

    setCreating(true);
    try {
      // Convert edited subtasks to TaskRequest format
      const subtaskRequests: TaskRequest[] = editableSubtasks.map(
        (subtask: SubtaskSuggestion) => ({
          title: subtask.title,
          description: subtask.description,
          status: "TODO" as const,
          isUrgent: subtask.isUrgent || false,
          isImportant: subtask.isImportant || false,
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

            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Review & Edit Subtasks ({editableSubtasks.length}):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {editableSubtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0)} minutes
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
                    <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 24 }}>
                      {index + 1}.
                    </Typography>
                    <TextField
                      fullWidth
                      label="Task Title"
                      value={subtask.title}
                      onChange={(e) => handleUpdateSubtask(index, "title", e.target.value)}
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
                    onChange={(e) => handleUpdateSubtask(index, "description", e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Box display="flex" gap={2} alignItems="center">
                    <TextField
                      type="number"
                      label="Estimated Minutes"
                      value={subtask.estimatedMinutes}
                      onChange={(e) =>
                        handleUpdateSubtask(index, "estimatedMinutes", parseInt(e.target.value) || 0)
                      }
                      size="small"
                      sx={{ width: 150 }}
                      InputProps={{ inputProps: { min: 5, max: 480 } }}
                    />

                    <Box display="flex" gap={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={subtask.isUrgent || false}
                            onChange={(e) =>
                              handleUpdateSubtask(index, "isUrgent", e.target.checked)
                            }
                            color="error"
                          />
                        }
                        label="Urgent"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={subtask.isImportant || false}
                            onChange={(e) =>
                              handleUpdateSubtask(index, "isImportant", e.target.checked)
                            }
                            color="warning"
                          />
                        }
                        label="Important"
                      />
                    </Box>
                  </Box>
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
            disabled={creating || editableSubtasks.length === 0}
          >
            {creating
              ? "Creating..."
              : `Create ${editableSubtasks.length} Subtask${editableSubtasks.length !== 1 ? 's' : ''}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AITaskBreakdown;
