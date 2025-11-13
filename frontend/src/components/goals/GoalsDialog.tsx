import React, { useState } from "react";
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
import { GOAL_TEMPLATES } from "../../constants/goalTemplates";

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: GoalFormData) => Promise<void>;
}

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

const GoalsDialog: React.FC<CreateGoalDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    type: "WEEKLY",
    startDate: "",
    endDate: "",
    targetTasks: undefined,
    targetPomodoros: undefined,
    targetFocusMinutes: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");

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
      console.error("Failed to create goal:", error);
      setSubmitError(
        error.response?.data?.message ||
          "Failed to create goal. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      type: "WEEKLY",
      startDate: "",
      endDate: "",
      targetTasks: undefined,
      targetPomodoros: undefined,
      targetFocusMinutes: undefined,
    });
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);

    if (templateId === "custom") {
      // Reset to empty
      setFormData({
        title: "",
        description: "",
        type: "WEEKLY",
        startDate: "",
        endDate: "",
        targetTasks: undefined,
        targetPomodoros: undefined,
        targetFocusMinutes: undefined,
      });
      return;
    }

    const template = GOAL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        title: template.title,
        description: template.description,
        type: template.type,
        startDate: "",
        endDate: "",
        targetTasks: template.targetTasks,
        targetPomodoros: template.targetPomodoros,
        targetFocusMinutes: template.targetFocusMinutes,
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Goal</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError("")}>
              {submitError}
            </Alert>
          )}

          {errors.targets && <Alert severity="warning">{errors.targets}</Alert>}

          {/* Template Selector */}
          <FormControl fullWidth>
            <InputLabel>Start From</InputLabel>
            <Select
              value={selectedTemplate}
              label="Start From"
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              <MenuItem value="custom">Custom Goal</MenuItem>
              <MenuItem disabled>──── Templates ────</MenuItem>
              {GOAL_TEMPLATES.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.title}
                </MenuItem>
              ))}
            </Select>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, ml: 2 }}
            >
              {selectedTemplate === "custom"
                ? "Create your own custom goal"
                : "Customize template values below"}
            </Typography>
          </FormControl>

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
          {isSubmitting ? "Creating..." : "Create Goal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalsDialog;
