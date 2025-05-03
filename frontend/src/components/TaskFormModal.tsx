import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Box,
} from "@mui/material";
import type { Task, TaskRequest } from "../types/task";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (taskData: TaskRequest) => Promise<void>;
  task?: Task;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  onClose,
  onSave,
  task,
}) => {
  const [formData, setFormData] = useState<TaskRequest>({
    title: "",
    description: "",
    isUrgent: false,
    isImportant: false,
    status: "TODO",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        isUrgent: task.isUrgent,
        isImportant: task.isImportant,
        status: task.status,
        dueDate: task.dueDate || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        isUrgent: false,
        isImportant: false,
        status: "TODO",
        dueDate: "",
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Title is required");
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
    } catch (err) {
      alert("Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            margin="normal"
            autoFocus
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            multiline
            rows={3}
            margin="normal"
          />

          <TextField
            fullWidth
            select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
            margin="normal"
          >
            <MenuItem value="TODO">To Do</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="datetime-local"
            label="Due Date"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            margin="normal"
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isUrgent || false}
                  onChange={(e) =>
                    setFormData({ ...formData, isUrgent: e.target.checked })
                  }
                />
              }
              label="Urgent"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isImportant || false}
                  onChange={(e) =>
                    setFormData({ ...formData, isImportant: e.target.checked })
                  }
                />
              }
              label="Important"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskFormModal;
