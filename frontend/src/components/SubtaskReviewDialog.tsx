import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
} from '@mui/material';

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
 * WIP: Dialog for reviewing/editing AI-generated subtasks
 *
 * TODOs:
 * - Make subtasks editable
 * - Allow removing subtasks
 * - Allow reordering
 * - Show total estimated time
 * - Better mobile layout
 */
export const SubtaskReviewDialog: React.FC<SubtaskReviewDialogProps> = ({
  open,
  subtasks: initialSubtasks,
  onClose,
  onConfirm,
}) => {
  const [subtasks, setSubtasks] = useState(initialSubtasks);

  // TODO: Implement edit functionality
  // TODO: Implement remove functionality
  // TODO: Implement reorder functionality

  const totalMinutes = subtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Review AI-Generated Subtasks
        <br />
        <span style={{ fontSize: '0.875rem', color: '#666' }}>
          Total time: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
        </span>
      </DialogTitle>
      <DialogContent>
        <List>
          {subtasks.map((subtask, index) => (
            <ListItem key={index}>
              {/* WIP: Make these editable */}
              <div>
                <strong>{subtask.title}</strong>
                <br />
                {subtask.description}
                <br />
                <small>
                  {subtask.estimatedMinutes}min - {subtask.priority}
                </small>
              </div>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(subtasks)}
        >
          Create {subtasks.length} Subtasks
        </Button>
      </DialogActions>
    </Dialog>
  );
};
