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
} from "@mui/material";

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: any) => void;
}

/**
 * WIP: Goal creation dialog
 *
 * TODO:
 * - add proper validation
 * - date picker not working yet
 * - api calls
 * - form state management odd
 */
const CreateGoalDialog: React.FC<CreateGoalDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("WEEKLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetTasks, setTargetTasks] = useState<number | "">("");
  const [targetPomodoros, setTargetPomodoros] = useState<number | "">("");
  const [targetFocusMinutes, setTargetFocusMinutes] = useState<number | "">("");

  const handleSubmit = () => {
    const goalData = {
      title,
      description,
      type,
      startDate,
      endDate,
      targetTasks: targetTasks || undefined,
      targetPomodoros: targetPomodoros || undefined,
      targetFocusMinutes: targetFocusMinutes || undefined,
    };

    onSubmit(goalData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Goal</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <FormControl fullWidth>
            <InputLabel>Goal Type</InputLabel>
            <Select
              value={type}
              label="Goal Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Target Tasks"
            type="number"
            value={targetTasks}
            onChange={(e) =>
              setTargetTasks(e.target.value ? Number(e.target.value) : "")
            }
            fullWidth
            helperText="Optional: Number of tasks to complete"
          />

          <TextField
            label="Target Pomodoros"
            type="number"
            value={targetPomodoros}
            onChange={(e) =>
              setTargetPomodoros(e.target.value ? Number(e.target.value) : "")
            }
            fullWidth
            helperText="Optional: Number of focus sessions"
          />

          <TextField
            label="Target Focus Minutes"
            type="number"
            value={targetFocusMinutes}
            onChange={(e) =>
              setTargetFocusMinutes(
                e.target.value ? Number(e.target.value) : ""
              )
            }
            fullWidth
            helperText="Optional: Total minutes of focused work"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create Goal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGoalDialog;
