import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Typography,
} from "@mui/material";
import type { Goal } from "../../services/goalService";

export interface GoalFormData {
  title: string;
  description?: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate: string;
  endDate: string;
  targetTasks?: number;
  targetPomodoros?: number;
  targetFocusMinutes?: number;
}

interface GoalsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: GoalFormData) => Promise<void>;
  goal?: Goal | null; // If provided, dialog is in edit mode
}

const defaultFormData: GoalFormData = {
  title: "",
  description: "",
  type: "WEEKLY",
  startDate: "",
  endDate: "",
  targetTasks: undefined,
  targetPomodoros: undefined,
  targetFocusMinutes: undefined,
};

/**
 * Formats a date string to YYYY-MM-DD format for input[type="date"]
 */
const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
};

const GoalsDialog: React.FC<GoalsDialogProps> = ({
  open,
  onClose,
  onSubmit,
  goal,
}) => {
  const isEditMode = !!goal;
  const [formData, setFormData] = useState<GoalFormData>(defaultFormData);

  // Populate form when editing an existing goal
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || "",
        type: goal.type,
        startDate: formatDateForInput(goal.startDate),
        endDate: formatDateForInput(goal.endDate),
        targetTasks: goal.targetTasks,
        targetPomodoros: goal.targetPomodoros,
        targetFocusMinutes: goal.targetFocusMinutes,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [goal]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.type) {
      newErrors.type = "Goal type is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    const hasTarget =
      (formData.targetTasks && formData.targetTasks > 0) ||
      (formData.targetPomodoros && formData.targetPomodoros > 0) ||
      (formData.targetFocusMinutes && formData.targetFocusMinutes > 0);

    if (!hasTarget) {
      newErrors.targets =
        "At least one target (tasks, pomodoros, or focus minutes) must be set";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} goal:`, error);
      setSubmitError(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} goal. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    setErrors({});
    setSubmitError("");
    onClose();
  };

  const updateField = (field: keyof GoalFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? "Edit Goal" : "Create New Goal"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError("")}>
              {submitError}
            </Alert>
          )}

          {errors.targets && <Alert severity="warning">{errors.targets}</Alert>}

          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            fullWidth
            required
            error={!!errors.title}
            helperText={errors.title}
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Optional: Add details about this goal"
          />

          <FormControl fullWidth required error={!!errors.type}>
            <InputLabel>Goal Type</InputLabel>
            <Select
              value={formData.type}
              label="Goal Type"
              onChange={(e) => updateField("type", e.target.value)}
            >
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
            </Select>
            {errors.type && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 2 }}
              >
                {errors.type}
              </Typography>
            )}
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            fullWidth
            required
            error={!!errors.startDate}
            helperText={errors.startDate}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <TextField
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            fullWidth
            required
            error={!!errors.endDate}
            helperText={errors.endDate}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <Typography variant="subtitle2" sx={{ mt: 1, mb: -1 }}>
            Target Metrics (at least one required)
          </Typography>

          <TextField
            label="Target Tasks"
            type="number"
            value={formData.targetTasks || ""}
            onChange={(e) =>
              updateField(
                "targetTasks",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            fullWidth
            slotProps={{
              htmlInput: {
                min: 1,
              },
            }}
            helperText="Number of tasks to complete"
          />

          <TextField
            label="Target Pomodoros"
            type="number"
            value={formData.targetPomodoros || ""}
            onChange={(e) =>
              updateField(
                "targetPomodoros",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            fullWidth
            slotProps={{
              htmlInput: {
                min: 1,
              },
            }}
            helperText="Number of focus sessions (works with custom profiles)"
          />

          <TextField
            label="Target Focus Minutes"
            type="number"
            value={formData.targetFocusMinutes || ""}
            onChange={(e) =>
              updateField(
                "targetFocusMinutes",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            fullWidth
            slotProps={{
              htmlInput: {
                min: 1,
              },
            }}
            helperText="Total minutes of focused work"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditMode ? "Saving..." : "Creating..."
            : isEditMode ? "Save Changes" : "Create Goal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalsDialog;
