import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Box,
} from "@mui/material";
import type { Task } from "../types/task";
import CategorySelector from "./CategorySelector";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  task?: Task;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  onClose,
  onSave,
  task,
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    status: "TODO",
    isUrgent: false,
    isImportant: false,
    dueDate: "",
    categoryId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: "",
        description: "",
        status: "TODO",
        isUrgent: false,
        isImportant: false,
        dueDate: "",
        categoryId: null,
      });
    }
  }, [task, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <Box color="error.main">{error}</Box>}

            <TextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
              autoFocus
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />

            <CategorySelector
              value={formData.categoryId || null}
              onChange={(categoryId) =>
                setFormData({ ...formData, categoryId })
              }
            />

            <TextField
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="TODO">To Do</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </TextField>

            <TextField
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate || ""}
              onChange={handleChange}
              slotProps={{
                inputLabel: { shrink: true },
              }}
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isUrgent"
                  checked={formData.isUrgent || false}
                  onChange={handleChange}
                />
              }
              label="Urgent"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isImportant"
                  checked={formData.isImportant || false}
                  onChange={handleChange}
                />
              }
              label="Important"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskFormModal;
