import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';

interface Subtask {
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: string;
}

interface SubtaskReviewDialogProps {
  open: boolean;
  subtasks: Subtask[];
  onClose: () => void;
  onConfirm: (subtasks: Subtask[]) => void;
}

/**
 * Dialog for reviewing/editing AI-generated subtasks.
 *
 * WIP: Making fields editable
 * TODO: Add drag-and-drop reordering
 */
export const SubtaskReviewDialog: React.FC<SubtaskReviewDialogProps> = ({
  open,
  subtasks: initialSubtasks,
  onClose,
  onConfirm,
}) => {
  const [subtasks, setSubtasks] = useState(initialSubtasks);

  const handleUpdate = (index: number, field: string, value: any) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    setSubtasks(updated);
  };

  const handleRemove = (index: number) => {
    const updated = subtasks.filter((_, i) => i !== index);
    setSubtasks(updated);
  };

  const totalMinutes = subtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Review AI-Generated Subtasks
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Total estimated time: {totalHours}h {remainingMinutes}m ({subtasks.length} tasks)
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          {subtasks.map((subtask, index) => (
            <ListItem
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 2,
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {/* TODO: Add drag handle for reordering */}
                <IconButton size="small" disabled>
                  <DragIndicator />
                </IconButton>

                <TextField
                  fullWidth
                  label="Task Title"
                  value={subtask.title}
                  onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                  size="small"
                />

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemove(index)}
                >
                  <Delete />
                </IconButton>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={subtask.description}
                onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                size="small"
                sx={{ mb: 1 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  type="number"
                  label="Minutes"
                  value={subtask.estimatedMinutes}
                  onChange={(e) =>
                    handleUpdate(index, 'estimatedMinutes', parseInt(e.target.value))
                  }
                  size="small"
                  sx={{ width: 120 }}
                  InputProps={{ inputProps: { min: 5, max: 480 } }}
                />

                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={subtask.priority}
                    label="Priority"
                    onChange={(e) => handleUpdate(index, 'priority', e.target.value)}
                  >
                    <MenuItem value="urgent">🔴 Urgent</MenuItem>
                    <MenuItem value="important">🟡 Important</MenuItem>
                    <MenuItem value="normal">🟢 Normal</MenuItem>
                    <MenuItem value="low">⚪ Low</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(subtasks)}
          disabled={subtasks.length === 0}
        >
          Create {subtasks.length} Subtask{subtasks.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
